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
  status: z.enum(["active", "repealed", "amended", "needs_review"]).default("active"),
  contractTypeTags: z.array(z.string()).min(1),
  keywords: z.array(z.string()).default([]),
  officialCitation: z.string().optional(), // np. "Dz.U. z 2023 r. poz. 725, art. 6"
  eliAddress: z.string().optional(), // np. "DU/2001/733"
  unifiedActEli: z.string().optional(), // np. "DU/2023/725"
  lastVerifiedAt: z.string().optional(), // ISO data ostatniej weryfikacji w API ELI Sejmu
  freshnessNotes: z.string().optional(), // informacja o ew. nowelizacjach lub konieczności weryfikacji
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

/**
 * Metadane aktu z oficjalnego API Sejmu RP (ELI).
 */
export const EliActMetadataSchema = z.object({
  ELI: z.string(),
  title: z.string(),
  publisher: z.string(),
  year: z.number().int(),
  pos: z.number().int(),
  status: z.string(),
  inForce: z.string(),
  announcementDate: z.string().optional(),
  changeDate: z.string().optional(),
  legalStatusDate: z.string().optional(),
  latestUnifiedTextId: z.string().optional(),
  amendingActsCount: z.number().int().default(0),
  recentAmendingActs: z.array(z.object({ id: z.string(), date: z.string().optional() })).default([]),
});

export type EliActMetadata = z.infer<typeof EliActMetadataSchema>;

/**
 * Wynik audytu świeżości pojedynczej jednostki redakcyjnej.
 */
export const FreshnessAuditResultSchema = z.object({
  unitId: z.string(),
  editorialUnit: z.string(),
  actTitle: z.string(),
  currentStatus: z.enum(["active", "repealed", "amended", "needs_review"]),
  isUpToDate: z.boolean(),
  legalStateDate: z.string(),
  reasons: z.array(z.string()),
  recommendedAction: z.enum([
    "none",
    "flag_for_lawyer_review",
    "deactivate",
    "update_content",
  ]),
  affectedChecklistItems: z.array(z.string()),
});

export type FreshnessAuditResult = z.infer<typeof FreshnessAuditResultSchema>;

/**
 * Zbiorczy raport audytu aktualności bazy prawnej.
 */
export const KnowledgeBaseAuditReportSchema = z.object({
  timestamp: z.string().datetime(),
  totalAudited: z.number().int(),
  upToDateCount: z.number().int(),
  outdatedOrAmendedCount: z.number().int(),
  needsReviewCount: z.number().int(),
  repealedCount: z.number().int(),
  auditResults: z.array(FreshnessAuditResultSchema),
  affectedChecklistCount: z.number().int(),
});

export type KnowledgeBaseAuditReport = z.infer<typeof KnowledgeBaseAuditReportSchema>;
