import { z } from "zod";
import { SeverityRatingSchema } from "./stage06-evaluation";

/**
 * Status weryfikacji uwagi przez audytora kodu.
 */
export const ValidationStatusSchema = z.enum([
  "verified", // w 100% potwierdzone (źródło w KB aktywne, cytat dosłowny, weryfikator popiera)
  "needs_verification", // brakuje pełnego potwierdzenia, nie publikować jako faktu
  "rejected", // źródło zmyślone lub cytat fałszywy - odrzucono
]);

export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;

/**
 * Wejście do odizolowanego Gemini-weryfikatora.
 * Zgodnie z regułą 03-gemini-api.md:
 * Dostaje tylko cytat, źródła i tezę, bez dostępu do uzasadnienia pierwszej oceny.
 */
export const GeminiVerifierInputSchema = z.object({
  findingId: z.string().uuid().optional(),
  quoteFromContract: z.string().min(1),
  thesis: z.string().min(5),
  sources: z
    .array(
      z.object({
        sourceId: z.string().min(1),
        editorialUnit: z.string(),
        legalText: z.string().min(5),
      })
    )
    .min(1),
});

export type GeminiVerifierInput = z.infer<typeof GeminiVerifierInputSchema>;

/**
 * Odpowiedź Gemini-weryfikatora w trybie Structured Output.
 */
export const GeminiVerifierOutputSchema = z.object({
  werdykt: z.enum(["popiera", "nie_popiera", "niepewne"]),
  uzasadnienie: z.string().min(5),
  popierajaceZrodlaIds: z.array(z.string()),
  watpliwosci: z.string().optional(),
});

export type GeminiVerifierOutput = z.infer<typeof GeminiVerifierOutputSchema>;

/**
 * Zwalidowana uwaga prawna po audycie kodu i weryfikatorze Gemini.
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
  geminiVerifierVerdict: z.enum(["popiera", "nie_popiera", "niepewne"]).optional(),
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
