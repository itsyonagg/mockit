import { DOMMatrix, Image, ImageData, Path2D } from "@napi-rs/canvas";

/**
 * pdfjs-dist (used by pdf-parse) expects browser canvas APIs at module load time.
 * Polyfill them on Node/Vercel before pdf-parse is imported.
 */
export function ensurePdfBrowserGlobals() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = DOMMatrix as unknown as typeof globalThis.DOMMatrix;
  }
  if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = Path2D as unknown as typeof globalThis.Path2D;
  }
  if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = ImageData as unknown as typeof globalThis.ImageData;
  }
  if (typeof globalThis.Image === "undefined") {
    globalThis.Image = Image as unknown as typeof globalThis.Image;
  }
}

ensurePdfBrowserGlobals();
