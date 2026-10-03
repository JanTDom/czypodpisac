import { z } from "zod";

/**
 * Pobrana jednostka wiedzy prawnej z legal-kb/ (artykuł, wpis UOKiK, orzeczenie).
 */
export const RetrievedLegalUnitSchema = z.object({
  id: z.string().min(1), // np. "uopl-art-6-ust-1"
  unitType: z.enum(["statute", "uokik_clause", "court_ruling", "official_guidance"]),
  actTitle: z.string().min(1),
  publicationAddress: z.string().optional(),
  editorialUnit: z.string().min(1), // np. "art. 6 ust. 1"
  content: z.string().min(1), // dosłowna treść przepisu
  sourceUrl: z.string().url(),
  legalStateDate: z.string(), // YYYY-MM-DD
  contentHashSha256: z.string().length(64),
  status: z.enum(["active", "repealed", "amended"]),
  relevanceScore: z.number().min(0).max(1).optional(),
});

export type RetrievedLegalUnit = z.infer<typeof RetrievedLegalUnitSchema>;

/**
 * Zestaw źródeł skompilowanych dla konkretnego punktu kontrolnego / klauzuli.
 */
export const ClauseRetrievalContextSchema = z.object({
  clauseId: z.string().min(1),
  checklistItemId: z.string().optional(),
  retrievedUnits: z.array(RetrievedLegalUnitSchema),
});

export type ClauseRetrievalContext = z.infer<typeof ClauseRetrievalContextSchema>;

/**
 * Wyjście z etapu Retrieval — zweryfikowane źródła dla wszystkich badanych elementów.
 */
export const RetrievalOutputSchema = z.object({
  contexts: z.array(ClauseRetrievalContextSchema),
  allRetrievedUnitIds: z.array(z.string()),
  missingRequiredSources: z.array(z.string()).default([]), // źródła wymagane przez checklistę, których brak w KB
});

export type RetrievalOutput = z.infer<typeof RetrievalOutputSchema>;
