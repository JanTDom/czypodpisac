import { z } from "zod";
import { TextBoundingBoxSchema } from "./stage01-ingest";

/**
 * Podjednostka klauzuli (ustęp, punkt, litera).
 */
export const ClauseSubItemSchema = z.object({
  id: z.string().min(1),
  marker: z.string().min(1), // np. "1.", "a)", "tire"
  text: z.string().min(1),
});

export type ClauseSubItem = z.infer<typeof ClauseSubItemSchema>;

/**
 * Wyodrębniona klauzula umowy ze zidentyfikowanym paragrafem/nagłówkiem.
 */
export const ExtractedClauseSchema = z.object({
  id: z.string().min(1), // np. "clause-par-3-ust-2"
  clauseNumber: z.string().min(1), // np. "§ 3", "Art. 4", "Punkt 2"
  title: z.string().optional(), // np. "Czynsz najmu i opłaty eksploatacyjne"
  fullText: z.string().min(1),
  subItems: z.array(ClauseSubItemSchema).default([]),
  pageNumber: z.number().int().positive(),
  boundingBox: TextBoundingBoxSchema.optional(),
  internalReferences: z.array(z.string()).default([]), // np. ["§ 2 ust. 1", "Załącznik nr 1"]
});

export type ExtractedClause = z.infer<typeof ExtractedClauseSchema>;

/**
 * Załącznik do umowy wyodrębniony ze struktury.
 */
export const ExtractedAttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1), // np. "Załącznik nr 1 — Protokół zdawczo-odbiorczy"
  presentInDocument: z.boolean(),
  pageNumber: z.number().int().positive().optional(),
});

export type ExtractedAttachment = z.infer<typeof ExtractedAttachmentSchema>;

/**
 * Wyjście z etapu segmentacji — uporządkowana lista klauzul dokumentu.
 */
export const SegmentationOutputSchema = z.object({
  clauses: z.array(ExtractedClauseSchema).min(1),
  attachments: z.array(ExtractedAttachmentSchema).default([]),
  definitions: z.record(z.string(), z.string()).default({}), // zdefiniowane pojęcia
  totalClausesCount: z.number().int().nonnegative(),
});

export type SegmentationOutput = z.infer<typeof SegmentationOutputSchema>;
