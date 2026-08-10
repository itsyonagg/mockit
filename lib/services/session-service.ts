import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  answers,
  evaluations,
  feedback,
  materials,
  questions,
  sessions,
} from "@/drizzle/schema";
import { analyzeIntake } from "@/lib/ai/analyzer";
import { generateCoachFeedback, generateFollowUp } from "@/lib/ai/coach";
import { predictQuestions } from "@/lib/ai/predictor";
import {
  evidenceLine,
} from "@/lib/evaluations/checks";
import { buildDashboardData } from "@/lib/evaluations/dashboard";
import { rubricToLegacyScores, runRubricEvaluation } from "@/lib/evaluations/rubrics";
import { PERSONA_QUESTION_HINTS } from "@/lib/constants/personas";
import { createId } from "@/lib/utils";
import type { CreateSessionInput, FeedbackParams } from "@/lib/validations/session";

let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await getDb();
    initialized = true;
  }
  return getDb();
}

function getMaterial(
  rows: { type: string; contentText: string; fileUrl?: string | null }[],
  type: string,
) {
  return rows.find((r) => r.type === type)?.contentText;
}

function getMaterialUrl(
  rows: { type: string; fileUrl?: string | null }[],
  type: string,
) {
  return rows.find((r) => r.type === type)?.fileUrl ?? undefined;
}

export async function createSession(input: CreateSessionInput) {
  const db = await ensureDb();
  const sessionId = createId("sess");
  const name =
    input.sessionName ??
    `${input.targetCompanyOrSchool} — ${input.targetRoleOrProgram}`;

  await db.insert(sessions).values({
    id: sessionId,
    name,
    status: "intake",
    targetCompanyOrSchool: input.targetCompanyOrSchool,
    targetRoleOrProgram: input.targetRoleOrProgram,
    targetIndustry: input.targetIndustry,
    userPersona: input.userPersona,
    interviewType: input.interviewType,
    specificConcerns: input.specificConcerns,
  });

  const materialEntries: {
    type: "resume" | "cover_letter" | "linkedin" | "personal_statement" | "job_description";
    content: string;
    fileUrl?: string;
  }[] = [{ type: "resume", content: input.resumeText }];

  if (input.jobOrProgramDescription) {
    materialEntries.push({
      type: "job_description",
      content: input.jobOrProgramDescription,
    });
  }
  if (input.coverLetterText) {
    materialEntries.push({ type: "cover_letter", content: input.coverLetterText });
  }
  if (input.linkedinUrl) {
    materialEntries.push({
      type: "linkedin",
      content: `LinkedIn profile: ${input.linkedinUrl}`,
      fileUrl: input.linkedinUrl,
    });
  }
  if (input.personalStatement) {
    materialEntries.push({
      type: "personal_statement",
      content: input.personalStatement,
    });
  }

  for (const entry of materialEntries) {
    await db.insert(materials).values({
      id: createId("mat"),
      sessionId,
      type: entry.type,
      contentText: entry.content,
      fileUrl: entry.fileUrl,
    });
  }

  return sessionId;
}

export async function analyzeSession(sessionId: string) {
  const db = await ensureDb();
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { materials: true },
  });
  if (!session) throw new Error("Session not found");

  await db
    .update(sessions)
    .set({ status: "analyzing", updatedAt: new Date().toISOString() })
    .where(eq(sessions.id, sessionId));

  const resume = getMaterial(session.materials, "resume") ?? "";
  const jobDescription = getMaterial(session.materials, "job_description");
  const coverLetter = getMaterial(session.materials, "cover_letter");
  const linkedin = getMaterial(session.materials, "linkedin");
  const linkedinUrl = getMaterialUrl(session.materials, "linkedin");
  const personalStatement = getMaterial(session.materials, "personal_statement");

  let analysisSummary = "Candidate profile ready for question prediction.";
  try {
    const analysis = await analyzeIntake({
      targetCompanyOrSchool: session.targetCompanyOrSchool,
      targetRoleOrProgram: session.targetRoleOrProgram,
      targetIndustry: session.targetIndustry ?? undefined,
      userPersona: session.userPersona ?? undefined,
      interviewType: session.interviewType,
      resumeText: resume,
      jobDescription,
      coverLetter,
      linkedin,
      linkedinUrl,
      personalStatement,
      specificConcerns: session.specificConcerns ?? undefined,
    });
    analysisSummary = analysis.summary;
  } catch {
    analysisSummary =
      "AI analysis unavailable — using heuristic question prediction. Set OPENAI_API_KEY for full analysis.";
  }

  let predicted: Awaited<ReturnType<typeof predictQuestions>>;
  try {
    predicted = await predictQuestions({
      targetCompanyOrSchool: session.targetCompanyOrSchool,
      targetRoleOrProgram: session.targetRoleOrProgram,
      targetIndustry: session.targetIndustry ?? undefined,
      userPersona: session.userPersona ?? undefined,
      interviewType: session.interviewType,
      analysisSummary,
      jobDescription,
      specificConcerns: session.specificConcerns ?? undefined,
      personaHints: session.userPersona
        ? PERSONA_QUESTION_HINTS[session.userPersona as keyof typeof PERSONA_QUESTION_HINTS]
        : undefined,
    });
  } catch {
    predicted = fallbackQuestions(session);
  }

  await db.delete(questions).where(eq(questions.sessionId, sessionId));

  for (const [index, q] of predicted.entries()) {
    await db.insert(questions).values({
      id: createId("q"),
      sessionId,
      text: q.text,
      source: "predicted",
      probabilityScore: q.probabilityScore,
      importanceScore: q.importanceScore,
      rationale: q.rationale,
      orderIndex: index,
      selected: true,
    });
  }

  await db
    .update(sessions)
    .set({ status: "ready", updatedAt: new Date().toISOString() })
    .where(eq(sessions.id, sessionId));

  return { analysisSummary, questionCount: predicted.length };
}

function fallbackQuestions(session: {
  targetCompanyOrSchool: string;
  targetRoleOrProgram: string;
  interviewType: string;
}) {
  const base = [
    {
      text: "Tell me about yourself.",
      probabilityScore: 95,
      importanceScore: 90,
      rationale: "Standard opener for nearly all interviews.",
    },
    {
      text: `Why ${session.targetCompanyOrSchool}?`,
      probabilityScore: 90,
      importanceScore: 95,
      rationale: "Tests motivation and company research.",
    },
    {
      text: `Why this ${session.targetRoleOrProgram} role specifically?`,
      probabilityScore: 88,
      importanceScore: 92,
      rationale: "Assesses fit between background and role requirements.",
    },
    {
      text: "Walk me through a challenging project and your specific contribution.",
      probabilityScore: 85,
      importanceScore: 88,
      rationale: "Resume-based behavioral question.",
    },
    {
      text: "Tell me about a time you failed or made a mistake. What did you learn?",
      probabilityScore: 80,
      importanceScore: 85,
      rationale: "Common behavioral probe for self-awareness.",
    },
  ];
  return base;
}

export async function getSessionDetail(sessionId: string) {
  const db = await ensureDb();
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      materials: true,
      questions: { orderBy: (q, { asc }) => [asc(q.orderIndex)] },
      answers: {
        with: {
          question: true,
          evaluations: { with: { feedbackItems: true } },
        },
      },
    },
  });
}

export async function listSessions() {
  const db = await ensureDb();
  return db.query.sessions.findMany({
    orderBy: (s, { desc }) => [desc(s.updatedAt)],
    limit: 20,
  });
}

export async function startMock(sessionId: string) {
  const db = await ensureDb();
  await db
    .update(sessions)
    .set({ status: "interviewing", updatedAt: new Date().toISOString() })
    .where(eq(sessions.id, sessionId));

  const selected = await db.query.questions.findMany({
    where: eq(questions.sessionId, sessionId),
    orderBy: (q, { asc }) => [asc(q.orderIndex)],
  });

  const queue = selected.filter((q) => q.selected);
  return queue[0] ?? null;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answerText: string,
  feedbackParams: FeedbackParams,
  options: {
    pushHarder?: boolean;
    answerMode?: "text" | "voice";
    durationSeconds?: number;
  } = {},
) {
  const db = await ensureDb();
  const { pushHarder = false, answerMode = "text", durationSeconds } = options;
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { materials: true },
  });
  if (!session) throw new Error("Session not found");

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });
  if (!question) throw new Error("Question not found");

  const answerId = createId("ans");
  await db.insert(answers).values({
    id: answerId,
    questionId,
    sessionId,
    contentText: answerText,
    answerMode,
    durationSeconds,
  });

  const jobDescription = getMaterial(session.materials, "job_description");
  const rubric = runRubricEvaluation(
    answerText,
    session.interviewType,
    jobDescription,
  );
  const scores = rubricToLegacyScores(rubric.dimensions);
  const checks = rubric.checks;

  const evaluationId = createId("eval");
  await db.insert(evaluations).values({
    id: evaluationId,
    answerId,
    scores,
    rubricScores: {
      interviewType: rubric.interviewType,
      overall: rubric.overall,
      dimensions: rubric.dimensions,
    },
    checks,
  });

  let coachingNotes =
    "Review the evaluation checks above and strengthen weak areas with specific metrics and clearer structure.";
  let sampleAnswer: string | undefined;

  try {
    const coach = await generateCoachFeedback({
      question: question.text,
      answer: answerText,
      checksSummary: checks.map((c) => `${c.name}: ${c.message}`).join("\n"),
      tone: feedbackParams.tone,
      depth: feedbackParams.depth,
      focusAreas: feedbackParams.focusAreas,
      interviewType: session.interviewType,
    });
    coachingNotes = coach.coachingNotes;
    sampleAnswer = coach.sampleAnswer;
  } catch {
    coachingNotes = buildOfflineFeedback(checks, feedbackParams);
  }

  await db.insert(feedback).values({
    id: createId("fb"),
    evaluationId,
    tone: feedbackParams.tone,
    depth: feedbackParams.depth,
    focusAreas: feedbackParams.focusAreas,
    coachingNotes,
    sampleAnswer: feedbackParams.depth === "deep" ? sampleAnswer : undefined,
  });

  let followUp: string | null = null;
  try {
    followUp = await generateFollowUp({
      question: question.text,
      answer: answerText,
      interviewType: session.interviewType,
      pushHarder,
    });
  } catch {
    followUp = null;
  }

  if (followUp) {
    await db.insert(questions).values({
      id: createId("q"),
      sessionId,
      text: followUp,
      source: "follow_up",
      orderIndex: question.orderIndex + 1,
      parentQuestionId: questionId,
      selected: true,
    });
  }

  const allQuestions = await db.query.questions.findMany({
    where: eq(questions.sessionId, sessionId),
    orderBy: (q, { asc }) => [asc(q.orderIndex)],
  });
  const answeredIds = new Set(
    (
      await db.query.answers.findMany({
        where: eq(answers.sessionId, sessionId),
      })
    ).map((a) => a.questionId),
  );

  const nextQuestion =
    allQuestions.find((q) => q.selected && !answeredIds.has(q.id)) ?? null;

  if (!nextQuestion) {
    await db
      .update(sessions)
      .set({ status: "completed", updatedAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId));
  }

  return {
    evaluation: {
      scores,
      checks,
      rubric: {
        overall: rubric.overall,
        dimensions: rubric.dimensions,
      },
      evidence: evidenceLine(session.materials, session.interviewType),
    },
    feedback: { coachingNotes, sampleAnswer },
    followUp,
    nextQuestion,
    done: !nextQuestion,
  };
}

export async function getSessionDashboard(sessionId: string) {
  await ensureDb();
  const session = await getSessionDetail(sessionId);
  if (!session) throw new Error("Session not found");
  return buildDashboardData(session);
}

function buildOfflineFeedback(
  checks: { name: string; status: string; message: string }[],
  params: FeedbackParams,
) {
  const issues = checks.filter((c) => c.status !== "pass");
  const lines = issues.map((c) => `- **${c.name}**: ${c.message}`);
  if (params.depth === "quick") return lines.slice(0, 3).join("\n");
  return [
    "### Coaching notes",
    ...lines,
    "",
    "_Set OPENAI_API_KEY for AI-generated coaching and sample answers._",
  ].join("\n");
}

export function exportSessionMarkdown(
  session: NonNullable<Awaited<ReturnType<typeof getSessionDetail>>>,
) {
  const lines = [
    `# MockIt Session: ${session.name}`,
    "",
    `**Target:** ${session.targetCompanyOrSchool} — ${session.targetRoleOrProgram}`,
    `**Interview type:** ${session.interviewType}`,
    `**Date:** ${session.createdAt}`,
    "",
    "## Transcript",
    "",
  ];

  for (const answer of session.answers) {
    lines.push(`### Q: ${answer.question.text}`);
    lines.push("");
    lines.push(answer.contentText);
    lines.push("");
    const evaluation = answer.evaluations[0];
    if (evaluation) {
      lines.push("**Scores:**");
      for (const [k, v] of Object.entries(evaluation.scores)) {
        lines.push(`- ${k}: ${v}/100`);
      }
      lines.push("");
      const fb = evaluation.feedbackItems[0];
      if (fb) {
        lines.push("**Feedback:**");
        lines.push(fb.coachingNotes);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}
