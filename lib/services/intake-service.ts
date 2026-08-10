import { eq, and } from "drizzle-orm";
import {
  DocumentParseError,
  extractTextFromFile,
  resolveDocumentText,
  saveUploadedFile,
} from "@/lib/files/parse-document";
import { getDb } from "@/lib/db";
import { materials } from "@/drizzle/schema";
import { createSession } from "@/lib/services/session-service";
import {
  getFileFromForm,
  parseIntakeFormFields,
} from "@/lib/validations/intake-form";
import type { CreateSessionInput } from "@/lib/validations/session";

async function setMaterialFileUrl(
  sessionId: string,
  type: "resume" | "personal_statement",
  fileUrl: string,
) {
  const db = await getDb();
  await db
    .update(materials)
    .set({ fileUrl })
    .where(and(eq(materials.sessionId, sessionId), eq(materials.type, type)));
}

export async function createSessionFromFormData(formData: FormData): Promise<string> {
  const fields = parseIntakeFormFields(formData);
  const resumeFile = getFileFromForm(formData, "resumeFile");
  const personalStatementFile = getFileFromForm(formData, "personalStatementFile");

  const resume = await resolveDocumentText(
    resumeFile,
    fields.resumeText,
    "Resume",
    true,
  );

  let personalStatement: string | undefined;
  if (personalStatementFile) {
    personalStatement = (await extractTextFromFile(personalStatementFile)).trim();
  } else if (fields.personalStatement?.trim()) {
    personalStatement = fields.personalStatement.trim();
  }

  const sessionInput: CreateSessionInput = {
    targetCompanyOrSchool: fields.targetCompanyOrSchool,
    targetRoleOrProgram: fields.targetRoleOrProgram,
    targetIndustry: fields.targetIndustry,
    userPersona: fields.userPersona,
    interviewType: fields.interviewType,
    specificConcerns: fields.specificConcerns,
    resumeText: resume.text,
    jobOrProgramDescription: fields.jobOrProgramDescription,
    linkedinUrl: fields.linkedinUrl,
    personalStatement,
  };

  const sessionId = await createSession(sessionInput);

  if (resumeFile) {
    const filePath = await saveUploadedFile(sessionId, resumeFile, "resume");
    await setMaterialFileUrl(sessionId, "resume", filePath);
  }
  if (personalStatementFile) {
    const filePath = await saveUploadedFile(sessionId, personalStatementFile, "personal-statement");
    await setMaterialFileUrl(sessionId, "personal_statement", filePath);
  }

  return sessionId;
}

export { DocumentParseError };
