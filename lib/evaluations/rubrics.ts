import type { EvaluationCheck } from "@/drizzle/schema";

export type RubricDimension = {
  id: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  feedback: string;
};

export type RubricResult = {
  interviewType: string;
  dimensions: RubricDimension[];
  overall: number;
  checks: EvaluationCheck[];
};

type RubricDefinition = {
  id: string;
  name: string;
  description: string;
  weight: number;
  evaluate: (ctx: RubricContext) => { score: number; feedback: string };
};

type RubricContext = {
  answerText: string;
  words: number;
  lower: string;
  interviewType: string;
  jobDescription?: string;
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
  hasMetrics: boolean;
  hedgeCount: number;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasMetrics(text: string) {
  return /\d+%|\$\d+|\d+\s*(people|users|customers|months|years|weeks)/i.test(text);
}

function starSegments(text: string) {
  const lower = text.toLowerCase();
  return {
    situation: /(situation|when|at the time|context|background)/i.test(lower),
    task: /(task|goal|responsible|needed to|objective)/i.test(lower),
    action: /(i (led|built|created|designed|implemented|worked|decided|drove|coordinated|developed))/i.test(
      lower,
    ),
    result: /(result|outcome|impact|increased|decreased|improved|saved|achieved|delivered)/i.test(
      lower,
    ),
  };
}

const BEHAVIORAL_RUBRIC: RubricDefinition[] = [
  {
    id: "star_structure",
    name: "STAR structure",
    description: "Situation, Task, Action, Result clearly articulated",
    weight: 0.25,
    evaluate: ({ star }) => {
      const count = Object.values(star).filter(Boolean).length;
      return {
        score: count * 25,
        feedback:
          count === 4
            ? "Strong STAR arc."
            : `Include missing STAR elements (${4 - count} weak/missing).`,
      };
    },
  },
  {
    id: "specificity_impact",
    name: "Specificity & impact",
    description: "Quantified outcomes and concrete details",
    weight: 0.25,
    evaluate: ({ hasMetrics, words }) => ({
      score: hasMetrics ? 90 : words > 80 ? 55 : 35,
      feedback: hasMetrics
        ? "Metrics and outcomes strengthen credibility."
        : "Add numbers, timelines, and measurable results.",
    }),
  },
  {
    id: "leadership_ownership",
    name: "Ownership & role clarity",
    description: "Your specific contribution vs team",
    weight: 0.2,
    evaluate: ({ lower }) => {
      const iCount = (lower.match(/\bi\b/g) ?? []).length;
      const weHeavy = (lower.match(/\bwe\b/g) ?? []).length > iCount * 2;
      return {
        score: weHeavy ? 45 : iCount >= 3 ? 85 : 60,
        feedback: weHeavy
          ? "Clarify YOUR actions — reduce vague 'we'."
          : "Ownership is reasonably clear.",
      };
    },
  },
  {
    id: "relevance",
    name: "Role relevance",
    description: "Answer maps to target role competencies",
    weight: 0.15,
    evaluate: ({ jobDescription, lower }) => {
      if (!jobDescription) return { score: 70, feedback: "Add JD for relevance scoring." };
      const tokens = jobDescription.toLowerCase().split(/\W+/).filter((t) => t.length > 4).slice(0, 25);
      const overlap = tokens.filter((t) => lower.includes(t)).length;
      return {
        score: Math.min(100, overlap * 15),
        feedback: overlap >= 3 ? "Well aligned with role requirements." : "Tie answer to JD keywords.",
      };
    },
  },
  {
    id: "delivery",
    name: "Delivery & confidence",
    description: "Clear, concise, confident communication",
    weight: 0.15,
    evaluate: ({ hedgeCount, words }) => ({
      score: Math.max(20, 100 - hedgeCount * 15 - (words > 450 ? 20 : 0)),
      feedback:
        hedgeCount > 2
          ? "Reduce hedging; speak with conviction."
          : words > 450
            ? "Tighten — aim for 60–90 seconds."
            : "Delivery is solid.",
    }),
  },
];

const TECHNICAL_RUBRIC: RubricDefinition[] = [
  {
    id: "problem_framing",
    name: "Problem framing",
    description: "Clarifies requirements and constraints before solving",
    weight: 0.2,
    evaluate: ({ lower }) => ({
      score: /(clarif|assumption|constraint|requirement|scale|input|output)/i.test(lower) ? 88 : 45,
      feedback: "Ask clarifying questions and state assumptions upfront.",
    }),
  },
  {
    id: "approach_structure",
    name: "Structured approach",
    description: "Logical step-by-step reasoning",
    weight: 0.25,
    evaluate: ({ lower, words }) => ({
      score: /(first|then|approach|step|tradeoff|complexity|design)/i.test(lower) && words > 60 ? 85 : 50,
      feedback: "Walk through your approach before diving into details.",
    }),
  },
  {
    id: "technical_depth",
    name: "Technical depth",
    description: "Correct concepts, tradeoffs, and alternatives",
    weight: 0.3,
    evaluate: ({ lower }) => {
      const depth = /(api|database|cache|latency|algorithm|architecture|test|deploy|security)/i.test(lower);
      return {
        score: depth ? 88 : 40,
        feedback: depth ? "Good technical vocabulary." : "Go deeper on implementation and tradeoffs.",
      };
    },
  },
  {
    id: "communication",
    name: "Communication",
    description: "Explains thinking clearly to interviewer",
    weight: 0.15,
    evaluate: ({ words, hedgeCount }) => ({
      score: Math.max(30, Math.min(100, words / 2 - hedgeCount * 10)),
      feedback: "Think aloud; narrate tradeoffs as you go.",
    }),
  },
  {
    id: "edge_cases",
    name: "Edge cases & validation",
    description: "Considers failure modes and testing",
    weight: 0.1,
    evaluate: ({ lower }) => ({
      score: /(edge|error|fail|test|monitor|rollback)/i.test(lower) ? 85 : 40,
      feedback: "Mention edge cases, errors, and how you'd validate.",
    }),
  },
];

const CASE_RUBRIC: RubricDefinition[] = [
  {
    id: "hypothesis",
    name: "Hypothesis & structure",
    description: "MECE framework, clear issue tree",
    weight: 0.25,
    evaluate: ({ lower }) => ({
      score: /(hypothesis|framework|bucket|driver|mece|structure)/i.test(lower) ? 90 : 45,
      feedback: "Lead with a hypothesis and structured framework.",
    }),
  },
  {
    id: "quantitative",
    name: "Quantitative reasoning",
    description: "Back-of-envelope math and sanity checks",
    weight: 0.25,
    evaluate: ({ hasMetrics, lower }) => ({
      score: hasMetrics || /(estimate|calculate|percent|market|revenue)/i.test(lower) ? 85 : 40,
      feedback: "Show your math; estimate key drivers.",
    }),
  },
  {
    id: "business_insight",
    name: "Business insight",
    description: "Industry-aware recommendations",
    weight: 0.25,
    evaluate: ({ lower }) => ({
      score: /(recommend|client|profit|cost|competitor|customer|strategy)/i.test(lower) ? 85 : 45,
      feedback: "Connect analysis to actionable business recommendations.",
    }),
  },
  {
    id: "synthesis",
    name: "Synthesis & conclusion",
    description: "Clear answer with next steps",
    weight: 0.15,
    evaluate: ({ lower }) => ({
      score: /(recommend|conclusion|summary|next step|therefore)/i.test(lower) ? 88 : 45,
      feedback: "End with a crisp recommendation and rationale.",
    }),
  },
  {
    id: "communication",
    name: "Executive communication",
    description: "Top-down, concise delivery",
    weight: 0.1,
    evaluate: ({ words }) => ({
      score: words >= 80 && words <= 400 ? 80 : 55,
      feedback: "Practice top-down communication: answer first, then support.",
    }),
  },
];

const ADMISSIONS_RUBRIC: RubricDefinition[] = [
  {
    id: "motivation",
    name: "Motivation & fit",
    description: "Why this program, authentic and specific",
    weight: 0.25,
    evaluate: ({ lower }) => ({
      score: /(why|program|school|culture|community|curriculum|fit)/i.test(lower) ? 85 : 45,
      feedback: "Be specific about why THIS institution — not generic praise.",
    }),
  },
  {
    id: "self_awareness",
    name: "Self-awareness",
    description: "Strengths, gaps, and growth",
    weight: 0.2,
    evaluate: ({ lower }) => ({
      score: /(learned|weakness|growth|feedback|improve|challenge)/i.test(lower) ? 85 : 50,
      feedback: "Show honest self-reflection without sounding rehearsed.",
    }),
  },
  {
    id: "leadership",
    name: "Leadership & impact",
    description: "Evidence of initiative and influence",
    weight: 0.25,
    evaluate: ({ star, hasMetrics }) => ({
      score: star.action && hasMetrics ? 90 : star.action ? 70 : 45,
      feedback: "Lead with a leadership story with measurable impact.",
    }),
  },
  {
    id: "goals",
    name: "Goals & trajectory",
    description: "Coherent short- and long-term plan",
    weight: 0.2,
    evaluate: ({ lower }) => ({
      score: /(goal|career|long.term|post|plan|industry|role)/i.test(lower) ? 82 : 45,
      feedback: "Connect past → MBA/program → future goals logically.",
    }),
  },
  {
    id: "authenticity",
    name: "Authenticity",
    description: "Genuine voice, not scripted",
    weight: 0.1,
    evaluate: ({ hedgeCount, words }) => ({
      score: Math.min(100, 70 + words / 10 - hedgeCount * 5),
      feedback: "Sound like yourself — specific beats polished but generic.",
    }),
  },
];

const RUBRICS: Record<string, RubricDefinition[]> = {
  behavioral: BEHAVIORAL_RUBRIC,
  technical: TECHNICAL_RUBRIC,
  case: CASE_RUBRIC,
  admissions: ADMISSIONS_RUBRIC,
  mixed: [...BEHAVIORAL_RUBRIC.slice(0, 3), ...TECHNICAL_RUBRIC.slice(0, 2)],
  panel: BEHAVIORAL_RUBRIC,
  other: BEHAVIORAL_RUBRIC,
};

export function runRubricEvaluation(
  answerText: string,
  interviewType: string,
  jobDescription?: string,
): RubricResult {
  const words = wordCount(answerText);
  const lower = answerText.toLowerCase();
  const star = starSegments(answerText);
  const ctx: RubricContext = {
    answerText,
    words,
    lower,
    interviewType,
    jobDescription,
    star,
    hasMetrics: hasMetrics(answerText),
    hedgeCount: ["i think", "maybe", "kind of", "sort of"].filter((h) =>
      lower.includes(h),
    ).length,
  };

  const definitions = RUBRICS[interviewType] ?? BEHAVIORAL_RUBRIC;
  const dimensions: RubricDimension[] = definitions.map((def) => {
    const { score, feedback } = def.evaluate(ctx);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      weight: def.weight,
      score: Math.max(0, Math.min(100, Math.round(score))),
      feedback,
    };
  });

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) /
      dimensions.reduce((sum, d) => sum + d.weight, 0),
  );

  const checks: EvaluationCheck[] = dimensions.map((d) => ({
    name: d.name,
    status: d.score >= 75 ? "pass" : d.score >= 50 ? "warn" : "fail",
    message: d.feedback,
  }));

  return { interviewType, dimensions, overall, checks };
}

export function rubricToLegacyScores(dimensions: RubricDimension[]) {
  const byId = Object.fromEntries(dimensions.map((d) => [d.id, d.score]));
  return {
    clarity: byId.delivery ?? byId.communication ?? dimensions[0]?.score ?? 70,
    structure: byId.star_structure ?? byId.approach_structure ?? byId.hypothesis ?? 70,
    relevance: byId.relevance ?? byId.motivation ?? byId.business_insight ?? 70,
    confidence: byId.delivery ?? byId.authenticity ?? 70,
    specificity: byId.specificity_impact ?? byId.quantitative ?? byId.technical_depth ?? 70,
    impact: byId.leadership_ownership ?? byId.synthesis ?? byId.leadership ?? 70,
  };
}
