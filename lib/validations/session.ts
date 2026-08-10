import { z } from "zod";
import { INDUSTRIES, USER_PERSONAS } from "@/lib/constants/personas";

export const userPersonaSchema = z.enum(USER_PERSONAS);
export const industrySchema = z.enum(INDUSTRIES);

export const interviewTypeSchema = z.enum([
  "behavioral",
  "technical",
  "case",
  "admissions",
  "panel",
  "mixed",
  "other",
]);

export const feedbackToneSchema = z.enum(["direct", "balanced", "supportive"]);
export const feedbackDepthSchema = z.enum(["quick", "standard", "deep"]);

export const feedbackFocusSchema = z.enum([
  "structure",
  "storytelling",
  "technical_depth",
  "culture_fit",
]);

export const createSessionSchema = z.object({
  targetCompanyOrSchool: z.string().min(1).max(200),
  targetRoleOrProgram: z.string().min(1).max(200),
  targetIndustry: industrySchema.optional(),
  userPersona: userPersonaSchema.optional(),
  interviewType: interviewTypeSchema,
  specificConcerns: z.string().max(2000).optional(),
  sessionName: z.string().max(100).optional(),
  resumeText: z.string().min(100),
  jobOrProgramDescription: z.string().max(20000).optional(),
  coverLetterText: z.string().max(10000).optional(),
  linkedinUrl: z.string().url().optional(),
  personalStatement: z.string().max(10000).optional(),
  resumeFileUrl: z.string().optional(),
  personalStatementFileUrl: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answerText: z.string().min(10).max(10000),
  answerMode: z.enum(["text", "voice"]).default("text"),
  durationSeconds: z.number().int().positive().optional(),
});

export const feedbackParamsSchema = z.object({
  tone: feedbackToneSchema.default("balanced"),
  depth: feedbackDepthSchema.default("standard"),
  focusAreas: z.array(feedbackFocusSchema).default([]),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type FeedbackParams = z.infer<typeof feedbackParamsSchema>;

export const INTERVIEW_TYPE_LABELS: Record<
  z.infer<typeof interviewTypeSchema>,
  string
> = {
  behavioral: "Behavioral",
  technical: "Technical",
  case: "Case",
  admissions: "Admissions",
  panel: "Panel",
  mixed: "Mixed",
  other: "Other",
};
