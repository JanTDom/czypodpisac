import { z } from "zod";
import { ContractTypeSchema } from "../pipeline/schemas/stage02-classification";

/**
 * Poziom ryzyka w punkcie checklisty.
 */
export const SeverityLevelSchema = z.enum(["red", "yellow", "green"]);
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

/**
 * Status weryfikacji punktu kontrolnego przez prawnika.
 * Wszystkie punkty startują w statusie "draft" i stają się "approved" dopiero po autoryzacji.
 */
export const LawyerReviewStatusSchema = z.enum(["draft", "approved", "needs_update"]);
export type LawyerReviewStatus = z.infer<typeof LawyerReviewStatusSchema>;

/**
 * Pojedynczy punkt kontrolny checklisty dla danego typu umowy.
 */
export const ChecklistItemSchema = z.object({
  id: z.string().min(1), // unikalny identyfikator (np. "najem-kaucja-limit")
  contractType: ContractTypeSchema,
  area: z.string().min(1), // obszar tematyczny (np. "Kaucja i zabezpieczenia")
  controlQuestion: z.string().min(5), // pytanie kontrolne ("Czy kaucja mieści się w limicie ustawowym?")
  redCriteria: z.string().min(5), // kryteria dyskwalifikujące / rażąco niekorzystne
  yellowCriteria: z.string().min(5), // kryteria wymagające uwagi / negocjacji
  greenCriteria: z.string().min(5), // zapis bezpieczny i standardowy
  missingIsRisk: z.boolean(), // czy brak zapisu w umowie rodzi ryzyko
  missingSeverity: z.enum(["red", "yellow", "none"]).default("none"),
  missingExplanation: z.string().optional(), // wyjaśnienie dlaczego brak jest groźny
  benchmarkParam: z.string().optional(), // identyfikator parametru do porównania z rynkiem
  kbSourceIds: z.array(z.string()).min(1), // identyfikatory jednostek z legal-kb/ (zakaz punktów bez źródeł!)
  uokikClauseNumbers: z.array(z.string()).optional(),
  courtRulingSignatures: z.array(z.string()).optional(),
  amendmentTemplateId: z.string().optional(),
  lawyerReviewStatus: LawyerReviewStatusSchema.default("draft"),
  version: z.number().int().positive().default(1),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

/**
 * Kompletna checklista dla danego typu umowy.
 */
export const ContractChecklistSchema = z.object({
  contractType: ContractTypeSchema,
  title: z.string().min(1),
  description: z.string(),
  version: z.string(),
  items: z.array(ChecklistItemSchema).min(1),
});

export type ContractChecklist = z.infer<typeof ContractChecklistSchema>;
