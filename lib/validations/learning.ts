import { z } from "zod";

export const actionPlanCategorySchema = z.enum([
  "behavior",
  "technical",
  "communication",
  "preparation",
  "mindset",
  "other",
]);

export const actionPlanStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const createActionPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: actionPlanCategorySchema.optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  source: z.enum(["coaching", "manual", "insight"]).optional(),
});

export const updateActionPlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: actionPlanCategorySchema.optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  status: actionPlanStatusSchema.optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const interviewOutcomeSchema = z.enum([
  "pending",
  "passed",
  "rejected",
  "offer",
  "withdrawn",
  "ongoing",
]);

export const saveDebriefSchema = z.object({
  interviewDate: z.string().optional(),
  outcome: interviewOutcomeSchema.optional(),
  howItWent: z.string().min(1).max(5000),
  questionAccuracyRating: z.number().int().min(1).max(5).optional(),
  questionsAsked: z.array(z.string()).optional(),
  questionsWeMissed: z.array(z.string()).optional(),
  unexpectedDifficulties: z.string().max(3000).optional(),
  whatWentWell: z.string().max(3000).optional(),
  whatToImprove: z.string().max(3000).optional(),
});

export type CreateActionPlanInput = z.infer<typeof createActionPlanSchema>;
export type UpdateActionPlanInput = z.infer<typeof updateActionPlanSchema>;
export type SaveDebriefInput = z.infer<typeof saveDebriefSchema>;

export const OUTCOME_LABELS: Record<
  z.infer<typeof interviewOutcomeSchema>,
  string
> = {
  pending: "Not yet interviewed",
  passed: "Advanced / passed round",
  rejected: "Rejected",
  offer: "Received offer",
  withdrawn: "Withdrew",
  ongoing: "In progress",
};
