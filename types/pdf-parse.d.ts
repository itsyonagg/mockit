declare module "pdf-parse/worker" {
  export class CanvasFactory {
    create(width: number, height: number): {
      canvas: unknown;
      context: unknown;
    };
    reset(
      canvasAndContext: { canvas: unknown; context: unknown },
      width: number,
      height: number,
    ): void;
    destroy(canvasAndContext: { canvas: unknown; context: unknown }): void;
  }
}

declare module "pdf-parse" {
  export class PDFParse {
    constructor(options: {
      data: Buffer | Uint8Array;
      CanvasFactory?: unknown;
      verbosity?: number;
    });
    getText(): Promise<{ text: string; pages: { text: string; num: number }[] }>;
    destroy(): Promise<void>;
  }
}
