import type { LearningInsights } from "@/drizzle/schema";
import { chatJson } from "./client";

export type LearningContext = {
  sessionCount: number;
  debriefCount: number;
  sessions: {
    name: string;
    target: string;
    interviewType: string;
    persona: string | null;
    overallScore: number | null;
    answersCompleted: number;
    topImprovements: string[];
  }[];
  debriefs: {
    sessionName: string;
    target: string;
    outcome: string | null;
    howItWent: string;
    questionAccuracyRating: number | null;
    unexpectedDifficulties: string | null;
    whatWentWell: string | null;
    whatToImprove: string | null;
    questionsAsked: string[];
    questionsMissed: string[];
  }[];
  actionPlans: {
    title: string;
    status: string;
    priority: string;
    category: string | null;
  }[];
  averageQuestionAccuracy: number | null;
};

export async function generateLearningInsights(
  context: LearningContext,
): Promise<LearningInsights> {
  const system = `You are MockIt, an interview coach analyzing a candidate's longitudinal practice and real interview history.
Return JSON matching this shape:
{
  "summary": string (2-3 sentences on overall trajectory),
  "behaviorPatterns": [{ "pattern": string, "evidence": string, "trend": "improving"|"stable"|"needs_attention" }],
  "improvementAreas": [{ "area": string, "priority": "high"|"medium"|"low", "recommendation": string, "sessionsAffected": number }],
  "longTermActionPlan": [{ "goal": string, "milestones": string[], "timeframe": string }],
  "predictionAccuracy": { "averageRating": number|null, "trend": string, "notes": string },
  "strengths": string[]
}
Rules:
- Base insights on provided data only; cite patterns across sessions/debriefs.
- longTermActionPlan should have 3-5 goals with concrete milestones.
- If data is sparse, say so honestly and give starter recommendations.
- No empty flattery.`;

  return chatJson<LearningInsights>(system, JSON.stringify(context));
}

export function buildOfflineInsights(context: LearningContext): LearningInsights {
  const avgAccuracy = context.averageQuestionAccuracy;
  const recurringAreas = new Map<string, number>();

  for (const session of context.sessions) {
    for (const area of session.topImprovements) {
      recurringAreas.set(area, (recurringAreas.get(area) ?? 0) + 1);
    }
  }

  const improvementAreas = [...recurringAreas.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([area, count]) => ({
      area,
      priority: count >= 2 ? ("high" as const) : ("medium" as const),
      recommendation: `Practice mock answers targeting "${area}" across upcoming sessions.`,
      sessionsAffected: count,
    }));

  return {
    summary:
      context.sessionCount === 0
        ? "Complete your first mock session and log a real interview debrief to unlock personalized learning insights."
        : `You've completed ${context.sessionCount} practice session${context.sessionCount === 1 ? "" : "s"}${context.debriefCount > 0 ? ` and logged ${context.debriefCount} real interview debrief${context.debriefCount === 1 ? "" : "s"}` : ""}. Focus on recurring improvement themes below.`,
    behaviorPatterns:
      context.debriefCount > 0
        ? [
            {
              pattern: "Post-interview reflection",
              evidence: `${context.debriefCount} debrief(s) logged`,
              trend: "stable" as const,
            },
          ]
        : [],
    improvementAreas,
    longTermActionPlan: improvementAreas.slice(0, 3).map((item) => ({
      goal: `Strengthen ${item.area}`,
      milestones: [
        `Complete 2 mock answers focused on ${item.area}`,
        "Log a debrief after your next real interview",
        "Review dashboard scores weekly",
      ],
      timeframe: "4-6 weeks",
    })),
    predictionAccuracy: {
      averageRating: avgAccuracy,
      trend:
        avgAccuracy === null
          ? "No debrief ratings yet"
          : avgAccuracy >= 4
            ? "Predictions align well with real interviews"
            : "Room to improve question prediction",
      notes:
        avgAccuracy === null
          ? "Rate question accuracy after real interviews to help MockIt learn."
          : `Average accuracy rating: ${avgAccuracy.toFixed(1)}/5`,
    },
    strengths:
      context.sessions.filter((s) => (s.overallScore ?? 0) >= 75).length > 0
        ? ["Strong mock scores in recent sessions"]
        : [],
  };
}
