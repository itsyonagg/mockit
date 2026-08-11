import { ensurePdfBrowserGlobals } from "@/lib/files/pdf-globals";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  ensurePdfBrowserGlobals();

  const { CanvasFactory } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({
    data: buffer,
    CanvasFactory,
  });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
