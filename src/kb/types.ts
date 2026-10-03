import { z } from "zod";

export const LegalKbUnitTypeSchema = z.enum([
  "statute", // przepis prawny z ustawy
  "uokik_clause", // wpis z rejestru klauzul niedozwolonych UOKiK
  "court_ruling", // orzeczenie SN, sądów powszechnych, TSUE
  "official_guidance", // stanowisko UOKiK, KNF, Rzecznika Finansowego
]);

export type LegalKbUnitType = z.infer<typeof LegalKbUnitTypeSchema>;

export const LegalKbUnitSchema = z.object({
  id: z.string().min(1),
  unitType: LegalKbUnitTypeSchema,
  actTitle: z.string().min(1),
  publicationAddress: z.string().optional(),
  editorialUnit: z.string().min(1), // np. "art. 6 ust. 1", "pkt 16", "teza"
  content: z.string().min(5),
  sourceUrl: z.string().url(),
  fetchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  legalStateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contentHashSha256: z.string().length(64),
  status: z.enum(["active", "repealed", "amended"]).default("active"),
  contractTypeTags: z.array(z.string()).min(1),
  keywords: z.array(z.string()).default([]),
  officialCitation: z.string().optional(), // np. "Dz.U. z 2023 r. poz. 725, art. 6"
});

export type LegalKbUnit = z.infer<typeof LegalKbUnitSchema>;

export const LegalKbIndexSchema = z.object({
  version: z.string(),
  generatedAt: z.string().datetime(),
  totalUnits: z.number().int().nonnegative(),
  unitsByAct: z.record(z.string(), z.number()),
  unitsByType: z.record(z.string(), z.number()),
  units: z.array(
    z.object({
      id: z.string(),
      unitType: LegalKbUnitTypeSchema,
      editorialUnit: z.string(),
      actTitle: z.string(),
      filePath: z.string(),
      legalStateDate: z.string(),
      status: z.string(),
      contractTypeTags: z.array(z.string()),
    })
  ),
});

export type LegalKbIndex = z.infer<typeof LegalKbIndexSchema>;
