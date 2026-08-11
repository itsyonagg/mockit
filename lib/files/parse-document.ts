import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { extractTextFromPdf } from "@/lib/files/pdf-extract";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md"]);

export class DocumentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentParseError";
  }
}

export function validateDocumentFile(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new DocumentParseError(
      `Unsupported file type "${ext}". Upload PDF, DOCX, TXT, or MD.`,
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new DocumentParseError("File exceeds 10 MB limit.");
  }
  if (file.size === 0) {
    throw new DocumentParseError("File is empty.");
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  validateDocumentFile(file);
  const ext = path.extname(file.name).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === ".txt" || ext === ".md") {
    return buffer.toString("utf-8").trim();
  }

  if (ext === ".pdf") {
    return extractTextFromPdf(buffer);
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new DocumentParseError(`Unsupported file type "${ext}".`);
}

export async function saveUploadedFile(
  sessionId: string,
  file: File,
  label: string,
): Promise<string> {
  if (process.env.VERCEL === "1") {
    return `vercel-ephemeral://${sessionId}/${label}${path.extname(file.name).toLowerCase()}`;
  }

  validateDocumentFile(file);
  const uploadsDir = path.join(process.cwd(), "uploads", sessionId);
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name).toLowerCase();
  const safeName = `${label}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function resolveDocumentText(
  file: File | null,
  pastedText: string | undefined,
  label: string,
  required = true,
): Promise<{ text: string }> {
  if (file && file.size > 0) {
    const text = await extractTextFromFile(file);
    if (text.length < 50) {
      throw new DocumentParseError(
        `${label} file did not contain enough readable text. Try paste mode or a different file.`,
      );
    }
    return { text };
  }

  const trimmed = pastedText?.trim() ?? "";
  if (trimmed.length > 0) {
    if (required && trimmed.length < 100) {
      throw new DocumentParseError(
        `${label} paste must be at least 100 characters, or upload a file.`,
      );
    }
    return { text: trimmed };
  }

  if (required) {
    throw new DocumentParseError(
      `${label} is required — upload a file or paste at least 100 characters.`,
    );
  }

  throw new DocumentParseError(`${label} is empty.`);
}
