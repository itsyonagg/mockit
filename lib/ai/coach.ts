import { chatJson } from "./client";

export async function generateFollowUp(input: {
  question: string;
  answer: string;
  interviewType: string;
  pushHarder?: boolean;
}): Promise<string | null> {
  const system = input.pushHarder
    ? `You are a tough but professional interviewer. Generate ONE realistic follow-up or objection based on the answer. Return JSON: { "followUp": string | null }. Push on vague claims, missing metrics, or weak reasoning.`
    : `You are a professional interviewer. If the answer warrants a follow-up, return JSON: { "followUp": string }. Otherwise { "followUp": null }. One question only.`;

  const result = await chatJson<{ followUp: string | null }>(
    system,
    JSON.stringify(input),
  );
  return result.followUp;
}

export async function generateCoachFeedback(input: {
  question: string;
  answer: string;
  checksSummary: string;
  tone: string;
  depth: string;
  focusAreas: string[];
  interviewType: string;
}): Promise<{ coachingNotes: string; sampleAnswer?: string }> {
  const system = `You are MockIt, an interview coach. Return JSON: { "coachingNotes": string (markdown bullets), "sampleAnswer": string (optional, only if depth is "deep") }.
Rules: no empty flattery, be constructive, preserve the candidate's authentic voice in sample answers.
Tone: ${input.tone}. Depth: ${input.depth}. Focus: ${input.focusAreas.join(", ") || "general"}.`;

  return chatJson<{ coachingNotes: string; sampleAnswer?: string }>(
    system,
    JSON.stringify(input),
  );
}
