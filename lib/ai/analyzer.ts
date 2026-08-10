import { chatJson } from "./client";

export type AnalysisResult = {
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  summary: string;
};

export async function analyzeIntake(input: {
  targetCompanyOrSchool: string;
  targetRoleOrProgram: string;
  targetIndustry?: string;
  userPersona?: string;
  interviewType: string;
  resumeText: string;
  jobDescription?: string;
  coverLetter?: string;
  linkedin?: string;
  linkedinUrl?: string;
  personalStatement?: string;
  specificConcerns?: string;
}): Promise<AnalysisResult> {
  const system = `You are an expert interview coach. Analyze the candidate's materials and return JSON with keys: strengths (string[]), weaknesses (string[]), positioning (string), summary (string). Be honest and specific — no generic flattery.`;

  const user = JSON.stringify(input, null, 2);
  return chatJson<AnalysisResult>(system, user);
}
