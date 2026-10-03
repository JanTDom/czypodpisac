import { z } from "zod";

/**
 * Pojedyncza propozycja poprawki do klauzuli (wersja miękka i stanowcza).
 */
export const ClauseAmendmentProposalSchema = z.object({
  findingId: z.string().uuid(),
  clauseNumber: z.string(), // np. "§ 4 ust. 2"
  originalText: z.string(),
  softReplacementText: z.string().min(5), // wersja ugodowa / partnerska
  firmReplacementText: z.string().min(5), // wersja stanowcza z przywołaniem przepisów
  legalRationale: z.string().min(10), // zwięzłe uzasadnienie prawne do komentarza Word / maila
  isApprovedTemplate: z.boolean(),
  needsLawyerVerification: z.boolean(),
});

export type ClauseAmendmentProposal = z.infer<typeof ClauseAmendmentProposalSchema>;

/**
 * Szablon wiadomości e-mail do drugiej strony umowy.
 */
export const NegotiationEmailDraftSchema = z.object({
  recipientRole: z.string(), // np. "Wynajmujący"
  subject: z.string().min(5),
  bodySoft: z.string().min(20), // wersja dyplomatyczna
  bodyFirm: z.string().min(20), // wersja stanowcza (z podstawami prawnymi)
  bulletPointsList: z.array(z.string()).min(1),
  mailtoUrl: z.string().optional(),
});

export type NegotiationEmailDraft = z.infer<typeof NegotiationEmailDraftSchema>;

/**
 * Wyjście z etapu generowania — gotowe poprawki, szablony maili i metadane eksportów.
 */
export const GenerationOutputSchema = z.object({
  analysisId: z.string().uuid(),
  amendments: z.array(ClauseAmendmentProposalSchema),
  negotiationEmail: NegotiationEmailDraftSchema,
  exportCapabilities: z.object({
    supportsDocxTrackChanges: z.boolean().default(true),
    supportsNativePrintPdf: z.boolean().default(true),
  }),
  generatedAt: z.string().datetime(),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
