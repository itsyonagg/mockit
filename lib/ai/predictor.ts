import { chatJson } from "./client";

export type PredictedQuestion = {
  text: string;
  probabilityScore: number;
  importanceScore: number;
  rationale: string;
};

export type PredictionResult = {
  questions: PredictedQuestion[];
};

export async function predictQuestions(input: {
  targetCompanyOrSchool: string;
  targetRoleOrProgram: string;
  targetIndustry?: string;
  userPersona?: string;
  interviewType: string;
  analysisSummary: string;
  jobDescription?: string;
  specificConcerns?: string;
  personaHints?: string[];
}): Promise<PredictedQuestion[]> {
  const system = `You predict likely interview questions for a specific opportunity. Return JSON: { "questions": [{ "text", "probabilityScore" (0-100), "importanceScore" (0-100), "rationale" }] }. Generate 8-12 tailored questions — NOT generic lists. Explain why each is likely. Prioritize by probability and importance. Weight questions for the candidate's industry, persona, company/school, and role.`;

  const result = await chatJson<PredictionResult>(system, JSON.stringify(input));
  return result.questions ?? [];
}
