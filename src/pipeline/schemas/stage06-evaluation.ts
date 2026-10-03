import { z } from "zod";

/**
 * Kolor oceny ryzyka klauzuli w raporcie świetlnym.
 */
export const SeverityRatingSchema = z.enum([
  "czerwony", // bezpośrednia sprzeczność z bezwzględnie obowiązującym przepisem, klauzula abuzywna, rażące ryzyko
  "żółty", // zapis niekorzystny, nieprecyzyjny, odbiegający od standardu rynkowego
  "zielony", // zapis zgodny z prawem, bezpieczny i symetryczny
]);

export type SeverityRating = z.infer<typeof SeverityRatingSchema>;

/**
 * Pojedyncza ocena cząstkowa zwrócona przez model LLM dla klauzuli i punktu checklisty.
 */
export const SingleClauseEvaluationSchema = z.object({
  clauseId: z.string().min(1),
  checklistItemId: z.string().optional(),
  ocena: SeverityRatingSchema,
  tytulPoLudzku: z.string().min(5).max(120), // zwięzły, zrozumiały tytuł dla użytkownika
  doslownyCytatZUmowy: z.string().min(1), // dokładny cytat fragmentu rodzącego ryzyko
  uzasadnienie: z.string().min(10), // wyjaśnienie po ludzku: co to oznacza w praktyce
  zrodlaIds: z.array(z.string()).min(1), // identyfikatory jednostek z legal-kb/ (musi być min. 1 źródło)
  pewnosc: z.number().min(0).max(1), // poziom pewności modelu
  kwotaRyzyka: z.number().nonnegative().optional(), // jeśli policzalna
  zalozeniaKwoty: z.string().optional(), // założenia obliczeniowe (np. "przy czynszu 3000 zł i 3 miesiącach...")
  propozycjaZmianyKierunek: z.string().optional(), // ogólna wytyczna co do zmiany brzmienia
});

export type SingleClauseEvaluation = z.infer<typeof SingleClauseEvaluationSchema>;

/**
 * Wyjście z etapu oceny — zbiór wszystkich ocen cząstkowych.
 */
export const EvaluationOutputSchema = z.object({
  evaluations: z.array(SingleClauseEvaluationSchema),
  totalEvaluated: z.number().int().nonnegative(),
  rawModelName: z.string().optional(),
  evaluatedAt: z.string().datetime(),
});

export type EvaluationOutput = z.infer<typeof EvaluationOutputSchema>;
