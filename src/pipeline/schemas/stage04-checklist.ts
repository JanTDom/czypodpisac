import { z } from "zod";
import { ContractTypeSchema } from "./stage02-classification";

/**
 * Zdefiniowany punkt kontrolny checklisty dla danego typu umowy.
 */
export const ChecklistDefinitionItemSchema = z.object({
  id: z.string().min(1), // np. "najem-kaucja-limit"
  contractType: ContractTypeSchema,
  area: z.string().min(1), // np. "Kaucja i zabezpieczenia"
  controlQuestion: z.string().min(5), // np. "Czy wysokość kaucji mieści się w limicie ustawowym?"
  redCriteria: z.string().min(5), // co powoduje czerwoną flagę
  yellowCriteria: z.string().min(5), // co powoduje żółtą flagę
  greenCriteria: z.string().min(5), // co jest zgodne ze standardem
  missingIsRisk: z.boolean(), // czy brak zapisu jest ryzykiem (np. brak protokołu)
  benchmarkParam: z.string().optional(), // np. "kaucja_wielokrotnosc_czynszu"
  kbSourceIds: z.array(z.string()).default([]), // np. ["uopl-art-6-ust-1"]
  uokikClauseNumbers: z.array(z.string()).default([]),
  courtRulingSignatures: z.array(z.string()).default([]),
  amendmentTemplateId: z.string().optional(),
  lawyerReviewStatus: z.enum(["draft", "approved", "needs_update"]).default("draft"),
});

export type ChecklistDefinitionItem = z.infer<typeof ChecklistDefinitionItemSchema>;

/**
 * Przypisanie klauzuli do punktu checklisty.
 */
export const ChecklistMatchSchema = z.object({
  checklistItemId: z.string().min(1),
  matchedClauseIds: z.array(z.string()).default([]), // identyfikatory klauzul pokrywających punkt
  isMissing: z.boolean(), // prawda, jeśli punktu w umowie w ogóle nie uregulowano
  missingRiskSeverity: z.enum(["red", "yellow", "none"]).default("none"),
  notes: z.string().optional(),
});

export type ChecklistMatch = z.infer<typeof ChecklistMatchSchema>;

/**
 * Wyjście z etapu Checklisty — kompletna mapa dopasowań dla dokumentu.
 */
export const ChecklistOutputSchema = z.object({
  contractType: ContractTypeSchema,
  totalItemsChecked: z.number().int().positive(),
  matches: z.array(ChecklistMatchSchema),
  unmatchedClauseIds: z.array(z.string()).default([]), // klauzule bez dedykowanego punktu checklisty (do ogólnego skanowania abuzywności)
});

export type ChecklistOutput = z.infer<typeof ChecklistOutputSchema>;
