import {
  LegalKbUnit,
  FreshnessAuditResult,
  KnowledgeBaseAuditReport,
  KnowledgeBaseAuditReportSchema,
} from "./types";
import { EliApiClient } from "./eli-client";
import { ChecklistRegistry } from "../checklists/registry";
import { LegalKnowledgeBase } from "./index";

/**
 * Mapa znanych aktów prawnych do ich identyfikatorów ELI w Sejmie RP.
 */
export const ACT_ELI_MAPPING: Record<string, { baseEli: string; defaultUnifiedEli?: string }> = {
  "ochronie praw lokatorów": {
    baseEli: "DU/2001/733",
    defaultUnifiedEli: "DU/2023/725",
  },
  "kodeks cywilny": {
    baseEli: "DU/1964/93",
    defaultUnifiedEli: "DU/2023/1610",
  },
  "kodeks pracy": {
    baseEli: "DU/1974/141",
    defaultUnifiedEli: "DU/2023/1465",
  },
  "prawach konsumenta": {
    baseEli: "DU/2014/827",
    defaultUnifiedEli: "DU/2023/2759",
  },
};

export class LawFreshnessGuard {
  private static instance: LawFreshnessGuard | null = null;
  private defaultEliClient: EliApiClient;
  private actMetaCache: Map<string, any> = new Map();

  constructor(eliClient?: EliApiClient) {
    this.defaultEliClient = eliClient || new EliApiClient();
  }

  public static getInstance(eliClient?: EliApiClient): LawFreshnessGuard {
    if (!LawFreshnessGuard.instance) {
      LawFreshnessGuard.instance = new LawFreshnessGuard(eliClient);
    }
    return LawFreshnessGuard.instance;
  }

  /**
   * Dopasowuje tytuł aktu z bazy legal-kb do klucza w mapie ELI.
   */
  public resolveActEli(actTitle: string): { baseEli: string; defaultUnifiedEli?: string } | null {
    for (const [key, mapping] of Object.entries(ACT_ELI_MAPPING)) {
      if (actTitle.toLowerCase().includes(key.toLowerCase())) {
        return mapping;
      }
    }
    return null;
  }

  /**
   * Sprawdza aktualność pojedynczej jednostki redakcyjnej w odniesieniu do stanu w API Sejmu.
   */
  public async auditUnitFreshness(
    unit: LegalKbUnit,
    registry?: ChecklistRegistry,
    client: EliApiClient = this.defaultEliClient
  ): Promise<FreshnessAuditResult> {
    const reasons: string[] = [];
    const reg = registry || ChecklistRegistry.getInstance();
    const affectedItems = this.getAffectedChecklistItems(unit.id, reg);

    // 1. Jednostki inne niż ustawy (UOKiK, orzecznictwo) mają odrębny reżim walidacji
    if (unit.unitType !== "statute") {
      return {
        unitId: unit.id,
        editorialUnit: unit.editorialUnit,
        actTitle: unit.actTitle,
        currentStatus: unit.status,
        isUpToDate: unit.status === "active",
        legalStateDate: unit.legalStateDate,
        reasons: unit.status === "active" ? ["Wpis aktywny w rejestrze/orzecznictwie"] : ["Wpis oznaczony jako nieaktywny"],
        recommendedAction: unit.status === "active" ? "none" : "flag_for_lawyer_review",
        affectedChecklistItems: affectedItems,
      };
    }

    // 2. Weryfikacja przepisów ustawowych w API Sejmu ELI
    const eliMapping = this.resolveActEli(unit.actTitle);
    if (!eliMapping) {
      return {
        unitId: unit.id,
        editorialUnit: unit.editorialUnit,
        actTitle: unit.actTitle,
        currentStatus: unit.status,
        isUpToDate: true,
        legalStateDate: unit.legalStateDate,
        reasons: ["Brak zmapowanego identyfikatora ELI dla tego aktu, wymaga weryfikacji manualnej"],
        recommendedAction: "none",
        affectedChecklistItems: affectedItems,
      };
    }

    try {
      // Pobieranie metadanych aktu bazowego z cache lub API
      let baseMeta = this.actMetaCache.get(eliMapping.baseEli);
      if (!baseMeta) {
        baseMeta = await client.getActMetadata(eliMapping.baseEli);
        if (baseMeta) this.actMetaCache.set(eliMapping.baseEli, baseMeta);
      }

      if (!baseMeta) {
        return {
          unitId: unit.id,
          editorialUnit: unit.editorialUnit,
          actTitle: unit.actTitle,
          currentStatus: unit.status,
          isUpToDate: false,
          legalStateDate: unit.legalStateDate,
          reasons: [`Nie odnaleziono aktu w API Sejmu pod ELI: ${eliMapping.baseEli}`],
          recommendedAction: "flag_for_lawyer_review",
          affectedChecklistItems: affectedItems,
        };
      }

      // Sprawdzenie czy akt nadal obowiązuje
      if (baseMeta.inForce === "NOT_IN_FORCE" || baseMeta.status.toLowerCase().includes("uchylon")) {
        reasons.push(`Akt prawny został uchylony w Sejmie RP (status: ${baseMeta.status})`);
        return {
          unitId: unit.id,
          editorialUnit: unit.editorialUnit,
          actTitle: unit.actTitle,
          currentStatus: "repealed",
          isUpToDate: false,
          legalStateDate: unit.legalStateDate,
          reasons,
          recommendedAction: "deactivate",
          affectedChecklistItems: affectedItems,
        };
      }

      // Sprawdzenie nowszych aktów zmieniających ogłoszonych po dacie stanu prawnego jednostki
      const recentAmendingAfterLegalState = baseMeta.recentAmendingActs.filter(
        (a: any) => a.date && a.date > unit.legalStateDate
      );

      if (recentAmendingAfterLegalState.length > 0) {
        const actIds = recentAmendingAfterLegalState.map((a: any) => `${a.id} (${a.date})`).join(", ");
        reasons.push(
          `Wykryto ${recentAmendingAfterLegalState.length} aktów zmieniających ogłoszonych po stanie prawnym jednostki (${unit.legalStateDate}): ${actIds}`
        );
      }

      // Sprawdzenie nowego tekstu jednolitego
      if (
        baseMeta.latestUnifiedTextId &&
        eliMapping.defaultUnifiedEli &&
        baseMeta.latestUnifiedTextId !== eliMapping.defaultUnifiedEli
      ) {
        reasons.push(
          `Dostępny jest nowszy tekst jednolity w Sejmie: ${baseMeta.latestUnifiedTextId} (zarejestrowany w bazie: ${eliMapping.defaultUnifiedEli})`
        );
      }

      const isUpToDate = reasons.length === 0 && unit.status === "active";
      let recommendedAction: "none" | "flag_for_lawyer_review" | "deactivate" | "update_content" = "none";

      if (!isUpToDate) {
        recommendedAction = "flag_for_lawyer_review";
      }

      return {
        unitId: unit.id,
        editorialUnit: unit.editorialUnit,
        actTitle: unit.actTitle,
        currentStatus: isUpToDate ? "active" : "needs_review",
        isUpToDate,
        legalStateDate: unit.legalStateDate,
        reasons: isUpToDate ? ["Stan prawny w pełni aktualny i zweryfikowany z API Sejmu"] : reasons,
        recommendedAction,
        affectedChecklistItems: affectedItems,
      };
    } catch (err: any) {
      return {
        unitId: unit.id,
        editorialUnit: unit.editorialUnit,
        actTitle: unit.actTitle,
        currentStatus: unit.status,
        isUpToDate: false,
        legalStateDate: unit.legalStateDate,
        reasons: [`Błąd komunikacji z API Sejmu: ${err.message}`],
        recommendedAction: "flag_for_lawyer_review",
        affectedChecklistItems: affectedItems,
      };
    }
  }

  /**
   * Zwraca identyfikatory wszystkich punktów checklist, które powołują się na dane źródło prawne.
   */
  public getAffectedChecklistItems(sourceId: string, registry: ChecklistRegistry): string[] {
    const affected: string[] = [];
    for (const contractType of registry.getAllSupportedContractTypes()) {
      const checklist = registry.getChecklist(contractType);
      if (!checklist) continue;
      for (const item of checklist.items) {
        if (item.kbSourceIds.includes(sourceId)) {
          affected.push(`${contractType}::${item.id}`);
        }
      }
    }
    return affected;
  }

  /**
   * Kaskadowa unieważnienie punktów checklisty po stwierdzeniu zmiany przepisu prawnego.
   * Każdy punkt powiązany z tą jednostką zostaje oznaczony jako 'needs_update'.
   */
  public cascadeInvalidate(
    changedUnitId: string,
    registry: ChecklistRegistry
  ): { affectedItems: string[]; updatedCount: number } {
    const affectedItems: string[] = [];

    for (const contractType of registry.getAllSupportedContractTypes()) {
      const checklist = registry.getChecklist(contractType);
      if (!checklist) continue;

      for (const item of checklist.items) {
        if (item.kbSourceIds.includes(changedUnitId)) {
          item.lawyerReviewStatus = "needs_update";
          affectedItems.push(`${contractType}::${item.id}`);
        }
      }
    }

    return {
      affectedItems,
      updatedCount: affectedItems.length,
    };
  }

  /**
   * Przeprowadza pełny audyt aktualności całej bazy legal-kb.
   */
  public async auditKnowledgeBase(
    kb: LegalKnowledgeBase,
    registry?: ChecklistRegistry,
    client: EliApiClient = this.defaultEliClient
  ): Promise<KnowledgeBaseAuditReport> {
    const reg = registry || ChecklistRegistry.getInstance();
    const units = kb.getAllUnits();
    const auditResults: FreshnessAuditResult[] = [];

    let upToDateCount = 0;
    let outdatedOrAmendedCount = 0;
    let needsReviewCount = 0;
    let repealedCount = 0;
    const allAffectedChecklistItems = new Set<string>();

    for (const unit of units) {
      const result = await this.auditUnitFreshness(unit, reg, client);
      auditResults.push(result);

      if (result.isUpToDate) {
        upToDateCount++;
      } else {
        outdatedOrAmendedCount++;
        if (result.currentStatus === "needs_review") needsReviewCount++;
        if (result.currentStatus === "repealed") repealedCount++;
        
        // Kaskadowo oznacz powiązane punkty checklisty
        for (const itemKey of result.affectedChecklistItems) {
          allAffectedChecklistItems.add(itemKey);
        }
      }
    }

    const report: KnowledgeBaseAuditReport = {
      timestamp: new Date().toISOString(),
      totalAudited: units.length,
      upToDateCount,
      outdatedOrAmendedCount,
      needsReviewCount,
      repealedCount,
      auditResults,
      affectedChecklistCount: allAffectedChecklistItems.size,
    };

    return KnowledgeBaseAuditReportSchema.parse(report);
  }
}
