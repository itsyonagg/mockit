import type { EvaluationScores, RubricScores } from "@/drizzle/schema";

export type DashboardImprovement = {
  area: string;
  priority: "high" | "medium" | "low";
  suggestion: string;
  occurrences: number;
};

export type DashboardData = {
  sessionId: string;
  sessionName: string;
  target: string;
  industry: string | null;
  persona: string | null;
  interviewType: string;
  overallScore: number;
  dimensionAverages: EvaluationScores;
  rubricAverages: { id: string; name: string; score: number }[];
  answersCompleted: number;
  questionsTotal: number;
  improvements: DashboardImprovement[];
  coachingActions: string[];
  recentScores: { question: string; overall: number; date: string }[];
};

type AnswerWithEval = {
  contentText: string;
  answeredAt: string;
  answerMode: string | null;
  question: { text: string };
  evaluations: {
    scores: EvaluationScores;
    rubricScores: RubricScores | null;
    checks: { name: string; status: string; message: string }[];
    feedbackItems: { coachingNotes: string }[];
  }[];
};

export function buildDashboardData(
  session: {
    id: string;
    name: string | null;
    targetCompanyOrSchool: string;
    targetRoleOrProgram: string;
    targetIndustry: string | null;
    userPersona: string | null;
    interviewType: string;
    questions: { id: string; selected: boolean }[];
    answers: AnswerWithEval[];
  },
): DashboardData {
  const evaluations = session.answers.flatMap((a) => a.evaluations);
  const rubricDimensions = evaluations.flatMap((e) => e.rubricScores?.dimensions ?? []);

  const dimensionAverages: EvaluationScores = {
    clarity: 0,
    structure: 0,
    relevance: 0,
    confidence: 0,
    specificity: 0,
    impact: 0,
  };

  if (evaluations.length > 0) {
    for (const key of Object.keys(dimensionAverages) as (keyof EvaluationScores)[]) {
      dimensionAverages[key] = Math.round(
        evaluations.reduce((s, e) => s + (e.scores[key] ?? 0), 0) / evaluations.length,
      );
    }
  }

  const rubricMap = new Map<string, { name: string; total: number; count: number }>();
  for (const d of rubricDimensions) {
    const existing = rubricMap.get(d.id) ?? { name: d.name, total: 0, count: 0 };
    existing.total += d.score;
    existing.count += 1;
    rubricMap.set(d.id, existing);
  }

  const rubricAverages = [...rubricMap.entries()].map(([id, v]) => ({
    id,
    name: v.name,
    score: Math.round(v.total / v.count),
  }));

  const overallFromRubrics =
    rubricDimensions.length > 0
      ? Math.round(
          rubricDimensions.reduce((s, d) => s + d.score * d.weight, 0) /
            rubricDimensions.reduce((s, d) => s + d.weight, 0),
        )
      : 0;

  const overallFromLegacy =
    evaluations.length > 0
      ? Math.round(
          Object.values(dimensionAverages).reduce((a, b) => a + b, 0) /
            Object.keys(dimensionAverages).length,
        )
      : 0;

  const overallScore = overallFromRubrics || overallFromLegacy;

  const failCounts = new Map<string, { message: string; count: number }>();
  for (const e of evaluations) {
    for (const c of e.checks) {
      if (c.status === "fail" || c.status === "warn") {
        const existing = failCounts.get(c.name) ?? { message: c.message, count: 0 };
        existing.count += 1;
        failCounts.set(c.name, existing);
      }
    }
  }

  const improvements: DashboardImprovement[] = [...failCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([area, v]) => ({
      area,
      priority: v.count >= 3 ? "high" : v.count >= 2 ? "medium" : "low",
      suggestion: v.message,
      occurrences: v.count,
    }));

  const coachingActions = improvements.map(
    (i) => `[${i.priority.toUpperCase()}] ${i.area}: ${i.suggestion}`,
  );

  if (coachingActions.length === 0 && evaluations.length === 0) {
    coachingActions.push(
      "Complete at least one mock interview answer to unlock personalized coaching.",
    );
  }

  const recentScores = session.answers
    .filter((a) => a.evaluations.length > 0)
    .map((a) => ({
      question: a.question.text,
      overall: a.evaluations[0]?.rubricScores?.overall ??
        Math.round(
          Object.values(a.evaluations[0]?.scores ?? {}).reduce((s, v) => s + v, 0) / 6,
        ),
      date: a.answeredAt,
    }));

  return {
    sessionId: session.id,
    sessionName: session.name ?? "Session",
    target: `${session.targetCompanyOrSchool} — ${session.targetRoleOrProgram}`,
    industry: session.targetIndustry,
    persona: session.userPersona,
    interviewType: session.interviewType,
    overallScore,
    dimensionAverages,
    rubricAverages,
    answersCompleted: session.answers.length,
    questionsTotal: session.questions.filter((q) => q.selected).length,
    improvements,
    coachingActions,
    recentScores,
  };
}
