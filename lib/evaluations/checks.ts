import type { EvaluationCheck, EvaluationScores } from "@/drizzle/schema";

const VAGUE_WORDS = [
  "various",
  "helped",
  "many",
  "several",
  "some",
  "things",
  "stuff",
  "worked on",
];

const HEDGING = [
  "i think",
  "maybe",
  "kind of",
  "sort of",
  "probably",
  "i guess",
  "i believe",
];

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasMetrics(text: string) {
  return /\d+%|\$\d+|\d+\s*(people|users|customers|months|years|weeks)/i.test(
    text,
  );
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

export function runEvaluationChecks(
  answerText: string,
  interviewType: string,
  jobDescription?: string,
): { checks: EvaluationCheck[]; scores: EvaluationScores } {
  const checks: EvaluationCheck[] = [];
  const words = wordCount(answerText);
  const lower = answerText.toLowerCase();

  const star = starSegments(answerText);
  if (interviewType === "behavioral" || interviewType === "mixed") {
    const missing = Object.entries(star)
      .filter(([, ok]) => !ok)
      .map(([k]) => k);
    checks.push({
      name: "STAR completeness",
      status: missing.length === 0 ? "pass" : missing.length <= 2 ? "warn" : "fail",
      message:
        missing.length === 0
          ? "All STAR elements detected."
          : `Missing or weak: ${missing.join(", ")}.`,
    });
  }

  const vagueHits = VAGUE_WORDS.filter((w) => lower.includes(w));
  checks.push({
    name: "Specificity",
    status:
      hasMetrics(answerText) && vagueHits.length <= 1
        ? "pass"
        : vagueHits.length >= 3
          ? "fail"
          : "warn",
    message:
      hasMetrics(answerText)
        ? "Includes quantifiable outcomes."
        : vagueHits.length
          ? `Vague phrasing: ${vagueHits.slice(0, 3).join(", ")}. Add metrics and names.`
          : "Add concrete numbers, timelines, and outcomes.",
  });

  const paragraphs = answerText.split(/\n\n+/).length;
  checks.push({
    name: "Structure",
    status: paragraphs >= 1 && words >= 50 ? "pass" : words < 30 ? "fail" : "warn",
    message:
      words < 30
        ? "Answer is too short — expand with context and impact."
        : "Ensure a clear hook, context, action, and result.",
  });

  if (jobDescription) {
    const jdTokens = jobDescription
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 4)
      .slice(0, 30);
    const overlap = jdTokens.filter((t) => lower.includes(t)).length;
    checks.push({
      name: "Relevance to target",
      status: overlap >= 3 ? "pass" : overlap >= 1 ? "warn" : "fail",
      message:
        overlap >= 3
          ? "Answer aligns with role requirements."
          : "Tie your answer more directly to the job description.",
    });
  }

  const hedgeHits = HEDGING.filter((h) => lower.includes(h));
  checks.push({
    name: "Confidence markers",
    status: hedgeHits.length === 0 ? "pass" : hedgeHits.length <= 2 ? "warn" : "fail",
    message:
      hedgeHits.length === 0
        ? "Confident, direct delivery."
        : `Reduce hedging: ${hedgeHits.slice(0, 3).join(", ")}.`,
  });

  checks.push({
    name: "Length appropriateness",
    status: words >= 75 && words <= 450 ? "pass" : words < 75 ? "warn" : "warn",
    message:
      words < 75
        ? `~${words} words — aim for 75–450 (~30 sec–3 min).`
        : words > 450
          ? `~${words} words — consider tightening.`
          : "Length is in a good range.",
  });

  const superlative = /best|always|never|everyone|perfect/i.test(answerText);
  checks.push({
    name: "Red flags",
    status: superlative && !hasMetrics(answerText) ? "warn" : "pass",
    message:
      superlative && !hasMetrics(answerText)
        ? "Bold claims need evidence — add specifics."
        : "No major red flags detected.",
  });

  const passCount = checks.filter((c) => c.status === "pass").length;
  const base = Math.round((passCount / checks.length) * 100);

  const scores: EvaluationScores = {
    clarity: Math.min(100, base + (words >= 50 ? 5 : -10)),
    structure: star.situation && star.result ? base + 5 : base - 5,
    relevance: jobDescription ? base : base - 5,
    confidence: hedgeHits.length === 0 ? base + 5 : base - hedgeHits.length * 5,
    specificity: hasMetrics(answerText) ? base + 10 : base - 10,
    impact: star.result && hasMetrics(answerText) ? base + 10 : base,
  };

  for (const key of Object.keys(scores) as (keyof EvaluationScores)[]) {
    scores[key] = Math.max(0, Math.min(100, scores[key]));
  }

  return { checks, scores };
}

export function evidenceLine(materials: { type: string }[], interviewType: string) {
  const parts = materials.map((m) => m.type.replace("_", " "));
  parts.push(interviewType);
  if (interviewType === "behavioral") parts.push("STAR");
  return `Based on: ${parts.join(" · ")}`;
}
