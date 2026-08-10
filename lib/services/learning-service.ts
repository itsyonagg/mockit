import { eq } from "drizzle-orm";
import {
  actionPlans,
  interviewDebriefs,
  learningSnapshots,
} from "@/drizzle/schema";
import {
  buildOfflineInsights,
  generateLearningInsights,
  type LearningContext,
} from "@/lib/ai/insights";
import { getDb } from "@/lib/db";
import { buildDashboardData } from "@/lib/evaluations/dashboard";
import { createId } from "@/lib/utils";
import type { SaveDebriefInput } from "@/lib/validations/learning";

let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await getDb();
    initialized = true;
  }
  return getDb();
}

export async function getDebrief(sessionId: string) {
  const db = await ensureDb();
  return db.query.interviewDebriefs.findFirst({
    where: eq(interviewDebriefs.sessionId, sessionId),
    orderBy: (d, { desc: dDesc }) => [dDesc(d.updatedAt)],
  });
}

export async function saveDebrief(sessionId: string, input: SaveDebriefInput) {
  const db = await ensureDb();
  const existing = await getDebrief(sessionId);
  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(interviewDebriefs)
      .set({
        interviewDate: input.interviewDate,
        outcome: input.outcome ?? existing.outcome,
        howItWent: input.howItWent,
        questionAccuracyRating: input.questionAccuracyRating,
        questionsAsked: input.questionsAsked,
        questionsWeMissed: input.questionsWeMissed,
        unexpectedDifficulties: input.unexpectedDifficulties,
        whatWentWell: input.whatWentWell,
        whatToImprove: input.whatToImprove,
        updatedAt: now,
      })
      .where(eq(interviewDebriefs.id, existing.id));

    return db.query.interviewDebriefs.findFirst({
      where: eq(interviewDebriefs.id, existing.id),
    });
  }

  const id = createId("deb");
  await db.insert(interviewDebriefs).values({
    id,
    sessionId,
    interviewDate: input.interviewDate ?? now.split("T")[0],
    outcome: input.outcome ?? "ongoing",
    howItWent: input.howItWent,
    questionAccuracyRating: input.questionAccuracyRating,
    questionsAsked: input.questionsAsked,
    questionsWeMissed: input.questionsWeMissed,
    unexpectedDifficulties: input.unexpectedDifficulties,
    whatWentWell: input.whatWentWell,
    whatToImprove: input.whatToImprove,
    createdAt: now,
    updatedAt: now,
  });

  return db.query.interviewDebriefs.findFirst({
    where: eq(interviewDebriefs.id, id),
  });
}

export async function listDebriefs() {
  const db = await ensureDb();
  return db.query.interviewDebriefs.findMany({
    orderBy: (d, { desc: dDesc }) => [dDesc(d.updatedAt)],
    with: { session: true },
  });
}

export async function buildLearningContext(): Promise<LearningContext> {
  const db = await ensureDb();

  const allSessions = await db.query.sessions.findMany({
    orderBy: (s, { desc: d }) => [d(s.updatedAt)],
    with: {
      questions: true,
      answers: {
        with: {
          question: true,
          evaluations: { with: { feedbackItems: true } },
        },
      },
    },
  });

  const allDebriefs = await db.query.interviewDebriefs.findMany({
    with: { session: true },
  });

  const allPlans = await db.query.actionPlans.findMany();

  const accuracyRatings = allDebriefs
    .map((d) => d.questionAccuracyRating)
    .filter((r): r is number => r != null);
  const averageQuestionAccuracy =
    accuracyRatings.length > 0
      ? accuracyRatings.reduce((a, b) => a + b, 0) / accuracyRatings.length
      : null;

  const sessionSummaries = allSessions.map((session) => {
    const dashboard = buildDashboardData(session);
    return {
      name: session.name ?? "Session",
      target: `${session.targetCompanyOrSchool} — ${session.targetRoleOrProgram}`,
      interviewType: session.interviewType,
      persona: session.userPersona,
      overallScore: dashboard.overallScore || null,
      answersCompleted: dashboard.answersCompleted,
      topImprovements: dashboard.improvements.slice(0, 3).map((i) => i.area),
    };
  });

  const debriefSummaries = allDebriefs.map((d) => ({
    sessionName: d.session?.name ?? "Session",
    target: d.session
      ? `${d.session.targetCompanyOrSchool} — ${d.session.targetRoleOrProgram}`
      : "",
    outcome: d.outcome,
    howItWent: d.howItWent,
    questionAccuracyRating: d.questionAccuracyRating,
    unexpectedDifficulties: d.unexpectedDifficulties,
    whatWentWell: d.whatWentWell,
    whatToImprove: d.whatToImprove,
    questionsAsked: d.questionsAsked ?? [],
    questionsMissed: d.questionsWeMissed ?? [],
  }));

  return {
    sessionCount: allSessions.length,
    debriefCount: allDebriefs.length,
    sessions: sessionSummaries,
    debriefs: debriefSummaries,
    actionPlans: allPlans.map((p) => ({
      title: p.title,
      status: p.status ?? "pending",
      priority: p.priority ?? "medium",
      category: p.category,
    })),
    averageQuestionAccuracy,
  };
}

export async function getLatestInsights() {
  const db = await ensureDb();
  return db.query.learningSnapshots.findFirst({
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
}

export async function generateAndSaveInsights(force = false) {
  const db = await ensureDb();
  const context = await buildLearningContext();

  if (context.sessionCount === 0 && context.debriefCount === 0) {
    return {
      insights: buildOfflineInsights(context),
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  }

  const latest = await getLatestInsights();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (
    !force &&
    latest &&
    new Date(latest.createdAt).getTime() > oneHourAgo &&
    latest.sessionCount === context.sessionCount &&
    latest.debriefCount === context.debriefCount
  ) {
    return {
      insights: latest.insights,
      cached: true,
      generatedAt: latest.createdAt,
    };
  }

  let insights;
  try {
    insights = await generateLearningInsights(context);
  } catch {
    insights = buildOfflineInsights(context);
  }

  if (!insights.predictionAccuracy) {
    insights.predictionAccuracy = {
      averageRating: context.averageQuestionAccuracy,
      trend: "",
      notes: "",
    };
  } else if (insights.predictionAccuracy.averageRating == null) {
    insights.predictionAccuracy.averageRating = context.averageQuestionAccuracy;
  }

  const id = createId("ls");
  const now = new Date().toISOString();
  await db.insert(learningSnapshots).values({
    id,
    insights,
    sessionCount: context.sessionCount,
    debriefCount: context.debriefCount,
    createdAt: now,
  });

  return { insights, cached: false, generatedAt: now };
}

export async function getProgressOverview() {
  const db = await ensureDb();
  const context = await buildLearningContext();
  const stats = {
    sessions: context.sessionCount,
    debriefs: context.debriefCount,
    actionPlans: context.actionPlans.length,
    completedPlans: context.actionPlans.filter((p) => p.status === "completed")
      .length,
    averageAccuracy: context.averageQuestionAccuracy,
  };

  const recentDebriefs = await db.query.interviewDebriefs.findMany({
    orderBy: (d, { desc: dDesc }) => [dDesc(d.updatedAt)],
    limit: 5,
    with: { session: true },
  });

  const recentPlans = await db.query.actionPlans.findMany({
    orderBy: (p, { desc: d }) => [d(p.updatedAt)],
    limit: 8,
    with: { session: true },
  });

  return { context, stats, recentDebriefs, recentPlans };
}
