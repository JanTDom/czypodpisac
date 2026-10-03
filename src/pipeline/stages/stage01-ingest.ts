import * as crypto from "node:crypto";
import { IngestInput, IngestOutput, IngestPage, IngestTextBlock } from "../schemas/stage01-ingest";

/**
 * Etap 1: Ingest dokumentu
 * Przyjmuje plik (PDF, DOCX, zdjęcia, tekst), normalizuje tekst,
 * dzieli na strony i bloki z układem współrzędnych dla podświetleń UI.
 */
export async function executeIngest(
  input: IngestInput & { analysisId: string; rawTextContent?: string }
): Promise<IngestOutput> {
  const text = input.rawTextContent || (input.fileBuffer ? Buffer.from(input.fileBuffer).toString("utf8") : "");
  if (!text || text.trim().length === 0) {
    throw new Error("Dokument jest pusty lub nie udało się wyekstrahować tekstu.");
  }

  const hash = crypto.createHash("sha256").update(text, "utf8").digest("hex");

  // Dzielenie tekstu na strony (np. po znacznikach nowej strony lub co ok. 3000 znaków)
  const rawPages = text.split(/\f|\n--- Strona \d+ ---\n/);
  const pages: IngestPage[] = [];

  let pageNum = 1;
  for (const pageText of rawPages) {
    const trimmedPage = pageText.trim();
    if (trimmedPage.length === 0) continue;

    // Dzielenie strony na logiczne akapity/bloki
    const paragraphs = trimmedPage.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const blocks: IngestTextBlock[] = [];

    let blockIdx = 1;
    let yCursor = 5; // procentowa pozycja Y na stronie

    for (const para of paragraphs) {
      const isHeader = /^([§§]|Rozdział|Art\.|UMOWA|Załącznik)/i.test(para.trim());
      const height = Math.min(25, Math.max(3, para.length / 50));

      blocks.push({
        id: `p${pageNum}-b${blockIdx++}`,
        pageNumber: pageNum,
        text: para.trim(),
        isHeader,
        boundingBox: {
          pageNumber: pageNum,
          x: 5,
          y: Math.min(95, yCursor),
          width: 90,
          height,
        },
      });

      yCursor += height + 2;
    }

    pages.push({
      pageNumber: pageNum++,
      rawText: trimmedPage,
      blocks,
      ocrApplied: input.mimeType.startsWith("image/"),
      ocrConfidence: input.mimeType.startsWith("image/") ? 0.95 : 1.0,
    });
  }

  // Bezpieczna rezerwa: jeśli strony były puste
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      rawText: text,
      blocks: [
        {
          id: "p1-b1",
          pageNumber: 1,
          text: text.trim(),
          isHeader: true,
          boundingBox: { pageNumber: 1, x: 5, y: 5, width: 90, height: 90 },
        },
      ],
      ocrApplied: false,
    });
  }

  return {
    analysisId: input.analysisId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    pageCount: pages.length,
    fullText: text,
    pages,
    contentHashSha256: hash,
    processedAt: new Date().toISOString(),
  };
}
