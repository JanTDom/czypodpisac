import { z } from "zod";
import { ValidatedFindingSchema } from "./stage07-validation";
import { BenchmarkParamComparisonSchema } from "./stage08-benchmark";
import { ContractTypeSchema, PartyStatusSchema, UserRoleSchema } from "./stage02-classification";

/**
 * Rekomendacja następnego kroku dla użytkownika.
 */
export const NextActionRecommendationSchema = z.enum([
  "mozesz_podpisac", // zielony raport, brak istotnych ryzyk
  "popros_o_zmiany", // drobne żółte uwagi, standardowe prośby
  "negocjuj", // istotne zapisy żółte/czerwone do zmiany
  "skonsultuj_z_prawnikiem", // czerwone klauzule o wysokim ryzyku finansowym / prawnym
]);

export type NextActionRecommendation = z.infer<typeof NextActionRecommendationSchema>;

/**
 * Element raportu dla brakującej klauzuli (której w umowie nie ma, a powinna być).
 */
export const MissingClauseReportItemSchema = z.object({
  id: z.string().uuid(),
  checklistItemId: z.string(),
  title: z.string().min(5),
  severity: z.enum(["czerwony", "żółty"]),
  whyImportant: z.string().min(10), // dlaczego brak tego zapisu naraża użytkownika
  recommendedClauseText: z.string().min(10),
  sourceIds: z.array(z.string()).default([]),
});

export type MissingClauseReportItem = z.infer<typeof MissingClauseReportItemSchema>;

/**
 * Kompletny zintegrowany raport ryzyka umowy.
 */
export const AggregatedReportSchema = z.object({
  analysisId: z.string().uuid(),
  contractType: ContractTypeSchema,
  userRole: UserRoleSchema,
  partyStatus: PartyStatusSchema,
  verdictOneSentence: z.string().min(10).max(180), // Jedno zdanie: "Można podpisać po zmianie §7 i §12"
  counts: z.object({
    red: z.number().int().nonnegative(),
    yellow: z.number().int().nonnegative(),
    missing: z.number().int().nonnegative(),
    green: z.number().int().nonnegative(),
  }),
  totalRiskAmount: z.number().nonnegative().optional(),
  totalRiskAssumptions: z.string().optional(),
  recommendedAction: NextActionRecommendationSchema,
  findings: z.object({
    red: z.array(ValidatedFindingSchema),
    yellow: z.array(ValidatedFindingSchema),
    missing: z.array(MissingClauseReportItemSchema),
    green: z.array(ValidatedFindingSchema),
  }),
  benchmarks: z.array(BenchmarkParamComparisonSchema).default([]),
  meta: z.object({
    aiGeneratedDisclaimer: z.literal(
      "Niniejsza analiza została wygenerowana przy użyciu systemu sztucznej inteligencji czypodpisac.pl i ma charakter informacyjny. Nie stanowi pomocy prawnej w rozumieniu ustawy o radcach prawnych."
    ),
    analyzedAt: z.string().datetime(),
    legalKbVersion: z.string(),
    checklistVersion: z.string(),
  }),
});

export type AggregatedReport = z.infer<typeof AggregatedReportSchema>;
