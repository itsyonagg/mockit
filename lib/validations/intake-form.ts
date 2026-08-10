import { z } from "zod";
import { INDUSTRIES, USER_PERSONAS } from "@/lib/constants/personas";
import {
  industrySchema,
  interviewTypeSchema,
  userPersonaSchema,
} from "@/lib/validations/session";

export const linkedinUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid LinkedIn URL.")
  .refine(
    (url) =>
      /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\//i.test(url),
    "URL must be a LinkedIn profile (linkedin.com/in/...).",
  );

const optionalString = z.string().trim().optional();

export const intakeFormFieldsSchema = z.object({
  targetCompanyOrSchool: z.string().trim().min(1).max(200),
  targetRoleOrProgram: z.string().trim().min(1).max(200),
  targetIndustry: z
    .string()
    .optional()
    .transform((v) => (v && INDUSTRIES.includes(v as (typeof INDUSTRIES)[number]) ? v : undefined))
    .pipe(industrySchema.optional()),
  userPersona: z
    .string()
    .optional()
    .transform((v) =>
      v && USER_PERSONAS.includes(v as (typeof USER_PERSONAS)[number]) ? v : undefined,
    )
    .pipe(userPersonaSchema.optional()),
  interviewType: interviewTypeSchema,
  specificConcerns: optionalString,
  jobOrProgramDescription: optionalString,
  resumeText: optionalString,
  personalStatement: optionalString,
  linkedinUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(linkedinUrlSchema.optional()),
});

export type IntakeFormFields = z.infer<typeof intakeFormFieldsSchema>;

export function parseIntakeFormFields(formData: FormData): IntakeFormFields {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  return intakeFormFieldsSchema.parse(raw);
}

export function getFileFromForm(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  if (value instanceof File && value.size > 0) return value;
  return null;
}
