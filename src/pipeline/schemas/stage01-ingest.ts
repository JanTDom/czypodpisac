import { z } from "zod";

/**
 * Pozycja bloku tekstowego na stronie dokumentu (do podświetleń w interfejsie).
 */
export const TextBoundingBoxSchema = z.object({
  pageNumber: z.number().int().positive(),
  x: z.number().min(0).max(100), // procent szerokości strony
  y: z.number().min(0).max(100), // procent wysokości strony
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
});

export type TextBoundingBox = z.infer<typeof TextBoundingBoxSchema>;

/**
 * Blok tekstu wyekstrahowany ze strony z metadanymi układu.
 */
export const IngestTextBlockSchema = z.object({
  id: z.string().min(1),
  pageNumber: z.number().int().positive(),
  text: z.string().min(1),
  isHeader: z.boolean().default(false),
  boundingBox: TextBoundingBoxSchema.optional(),
});

export type IngestTextBlock = z.infer<typeof IngestTextBlockSchema>;

/**
 * Strona dokumentu poddana normalizacji i ekstrakcji tekstu/OCR.
 */
export const IngestPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  rawText: z.string(),
  blocks: z.array(IngestTextBlockSchema),
  ocrApplied: z.boolean().default(false),
  ocrConfidence: z.number().min(0).max(1).optional(),
});

export type IngestPage = z.infer<typeof IngestPageSchema>;

/**
 * Wejście do etapu Ingest (plik binarny lub bufor).
 */
export const IngestInputSchema = z.object({
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative().default(0),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
  ]),
  fileBuffer: z.instanceof(Uint8Array).optional(),
  storagePath: z.string().min(1).optional(),
});

export type IngestInput = z.infer<typeof IngestInputSchema>;

/**
 * Wyjście z etapu Ingest — znormalizowany tekst z mapą stron i bloków.
 */
export const IngestOutputSchema = z.object({
  analysisId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  pageCount: z.number().int().positive(),
  fullText: z.string().min(1),
  pages: z.array(IngestPageSchema).min(1),
  contentHashSha256: z.string().length(64),
  processedAt: z.string().datetime(),
});

export type IngestOutput = z.infer<typeof IngestOutputSchema>;
