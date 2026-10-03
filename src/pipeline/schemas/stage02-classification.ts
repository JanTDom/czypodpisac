import { z } from "zod";

/**
 * Obsługiwane typy umów w systemie.
 */
export const ContractTypeSchema = z.enum([
  "najem_lokalu_mieszkalnego", // najem zwykły lokalu mieszkalnego
  "najem_okazjonalny", // najem okazjonalny lokalu (art. 19a-19e UoPL)
  "najem_instytucjonalny", // najem instytucjonalny lokalu (art. 19f-19k UoPL)
  "najem_lokalu_uzytkowego", // najem komercyjny / lokalu użytkowego (KC)
  "umowa_o_prace", // umowa o pracę (Kodeks pracy)
  "b2b_uslugi_freelancer", // kontrakt B2B / świadczenie usług (art. 750 KC)
  "zlecenie", // umowa zlecenia (art. 734-751 KC)
  "dzielo", // umowa o dzieło (art. 627-646 KC)
  "umowa_deweloperska", // umowa deweloperska (ustawa deweloperska i DFG)
  "kredyt_konsumencki", // kredyt / pożyczka konsumencka
  "leasing_konsumencki", // leasing konsumencki
  "owu_ubezpieczenie", // ogólne warunki ubezpieczenia
  "telekomunikacyjna", // umowa o świadczenie usług telekomunikacyjnych
  "inna_nieznana",
]);

export type ContractType = z.infer<typeof ContractTypeSchema>;

/**
 * Rola użytkownika w umowie.
 */
export const UserRoleSchema = z.enum([
  "najemca", // najemca lokalu
  "wynajmujacy", // wynajmujący
  "zamawiajacy", // zlecający / zamawiający
  "wykonawca", // wykonawca / zleceniobiorca
  "pracownik", // pracownik w stosunku pracy
  "pracodawca", // pracodawca
  "nabywca", // kupujący / nabywca lokalu
  "deweloper",
  "klient", // konsument / klient
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Status prawny użytkownika określający poziom ochrony konsumenckiej.
 */
export const PartyStatusSchema = z.enum([
  "consumer", // konsument (pełna ochrona art. 385[1] k.c.)
  "consumer_entrepreneur", // przedsiębiorca na prawach konsumenta (art. 385[5] k.c.)
  "business", // przedsiębiorca B2B (standardowe reguły handlowe)
]);

export type PartyStatus = z.infer<typeof PartyStatusSchema>;

/**
 * Pytanie doprecyzowujące kontekst (maksymalnie 3 pytania dla użytkownika).
 */
export const ContextQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(5),
  description: z.string().optional(),
  options: z.array(
    z.object({
      value: z.string().min(1),
      label: z.string().min(1),
    })
  ).min(2),
  selectedValue: z.string().optional(),
});

export type ContextQuestion = z.infer<typeof ContextQuestionSchema>;

/**
 * Wejście do etapu klasyfikacji: znormalizowany tekst z etapu Ingest + opcjonalne odpowiedzi użytkownika.
 */
export const ClassificationInputSchema = z.object({
  fullText: z.string().min(10),
  fileName: z.string().min(1),
  userProvidedAnswers: z.record(z.string(), z.string()).optional(),
});

export type ClassificationInput = z.infer<typeof ClassificationInputSchema>;

/**
 * Wyjście z etapu klasyfikacji: rozpoznany typ umowy, rola, status prawny oraz opcjonalne pytania.
 */
export const ClassificationOutputSchema = z.object({
  contractType: ContractTypeSchema,
  userRole: UserRoleSchema,
  partyStatus: PartyStatusSchema,
  confidence: z.number().min(0).max(1),
  needsUserClarification: z.boolean(),
  clarificationQuestions: z.array(ContextQuestionSchema).max(3),
  detectedParties: z.array(
    z.object({
      role: z.string(),
      nameOrIdentifier: z.string().optional(),
      isIdentifiedAsConsumer: z.boolean(),
    })
  ),
  detectedFinancials: z
    .object({
      rentAmount: z.number().positive().optional(),
      currency: z.string().default("PLN"),
      depositAmount: z.number().positive().optional(),
    })
    .optional(),
});

export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>;
