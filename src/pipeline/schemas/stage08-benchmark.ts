import { z } from "zod";

/**
 * Kwalifikacja zapisu względem benchmarku rynkowego.
 */
export const MarketClassificationSchema = z.enum([
  "standard_rynkowy", // zapis w granicach typowej rynkowej mediany
  "odbiega_od_normy", // zapis rzadziej spotykany, mniej korzystny niż mediana
  "skrajny", // zapis skrajnie niekorzystny, niespotykany w typowych umowach
  "brak_danych", // próba statystyczna zbyt mała (N < 50), zakaz etykietowania
]);

export type MarketClassification = z.infer<typeof MarketClassificationSchema>;

/**
 * Wynik porównania pojedynczego parametru z danymi rynkowymi.
 */
export const BenchmarkParamComparisonSchema = z.object({
  paramKey: z.string().min(1), // np. "kaucja_wielokrotnosc_czynszu", "termin_wypowiedzenia_dni"
  label: z.string().min(1),
  contractValue: z.union([z.number(), z.string()]),
  marketMedianValue: z.union([z.number(), z.string()]).optional(),
  sampleSize: z.number().int().nonnegative(),
  hasSufficientSample: z.boolean(), // N >= 50
  classification: MarketClassificationSchema,
  explanation: z.string(),
});

export type BenchmarkParamComparison = z.infer<typeof BenchmarkParamComparisonSchema>;

/**
 * Wyjście z etapu benchmarku rynkowego.
 */
export const BenchmarkOutputSchema = z.object({
  comparisons: z.array(BenchmarkParamComparisonSchema),
  benchmarkVersion: z.string(),
});

export type BenchmarkOutput = z.infer<typeof BenchmarkOutputSchema>;
