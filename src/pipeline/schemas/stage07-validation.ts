import { z } from "zod";
import { SeverityRatingSchema, SingleClauseEvaluationSchema } from "./stage06-evaluation";

/**
 * Status weryfikacji uwagi przez audytora kodu.
 */
export const ValidationStatusSchema = z.enum([
  "verified", // w 100% potwierdzone (źródło w KB aktywne, cytat dosłowny)
  "needs_verification", // brakuje pełnego potwierdzenia, nie publikować jako faktu
  "rejected", // źródło zmyślone lub cytat fałszywy - odrzucono
]);

export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;

/**
 * Zwalidowana uwaga prawna.
 */
export const ValidatedFindingSchema = z.object({
  id: z.string().uuid(),
  clauseId: z.string().min(1),
  checklistItemId: z.string().optional(),
  status: ValidationStatusSchema,
  ocena: SeverityRatingSchema,
  tytulPoLudzku: z.string(),
  doslownyCytatZUmowy: z.string(),
  cytatZweryfikowany: z.boolean(),
  uzasadnienie: z.string(),
  zweryfikowaneZrodlaIds: z.array(z.string()),
  odrzuconeZrodlaIds: z.array(z.string()).default([]),
  pewnosc: z.number().min(0).max(1),
  kwotaRyzyka: z.number().nonnegative().optional(),
  zalozeniaKwoty: z.string().optional(),
  powodOdrzuceniaLubNiepewnosci: z.string().optional(),
});

export type ValidatedFinding = z.infer<typeof ValidatedFindingSchema>;

/**
 * Wyjście z etapu walidacji — wyłącznie zweryfikowane uwagi oraz wykaz odrzuconych.
 */
export const ValidationOutputSchema = z.object({
  verifiedFindings: z.array(ValidatedFindingSchema),
  unverifiedFindings: z.array(ValidatedFindingSchema), // trafiają do logów / przeglądu prawnika, nie do użytkownika jako fakt
  rejectedCount: z.number().int().nonnegative(),
  isGroundingClean: z.boolean(), // true, jeśli zero zmyślonych źródeł
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;
