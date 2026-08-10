declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
  }

  function pdf(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
  export default pdf;
}
