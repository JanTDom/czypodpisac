import { SegmentationOutput } from "../schemas/stage03-segmentation";
import { ChecklistOutput } from "../schemas/stage04-checklist";
import { RetrievalOutput, ClauseRetrievalContext } from "../schemas/stage05-retrieval";
import { LegalKnowledgeBase, HybridLegalSearch } from "../../kb";
import { ChecklistRegistry } from "../../checklists/registry";

/**
 * Etap 5: Retrieval źródeł prawnych
 * Dla każdej powiązanej klauzuli pobiera autorytatywne źródła z legal-kb/
 * w oparciu o identyfikatory przypisane do punktu checklisty oraz wyszukiwanie hybrydowe.
 */
export async function executeRetrieval(
  checklistOutput: ChecklistOutput,
  segmentation: SegmentationOutput,
  contractDate: string = new Date().toISOString().slice(0, 10),
  kb: LegalKnowledgeBase = LegalKnowledgeBase.getInstance(),
  registry: ChecklistRegistry = ChecklistRegistry.getInstance()
): Promise<RetrievalOutput> {
  const hybridSearch = new HybridLegalSearch(kb);
  const contexts: ClauseRetrievalContext[] = [];
  const allRetrievedUnitIdsSet = new Set<string>();
  const missingRequiredSources: string[] = [];

  for (const match of checklistOutput.matches) {
    if (match.isMissing) continue;

    const checklistItem = registry.getItemById(match.checklistItemId);
    if (!checklistItem) continue;

    for (const clauseId of match.matchedClauseIds) {
      const clause = segmentation.clauses.find((c) => c.id === clauseId);
      if (!clause) continue;

      const retrievedUnitsMap = new Map();

      // 1. Bezpośrednie pobranie jednostek zdefiniowanych w punkcie checklisty
      for (const sourceId of checklistItem.kbSourceIds) {
        const unit = kb.getById(sourceId);
        if (unit && unit.status === "active") {
          retrievedUnitsMap.set(unit.id, {
            id: unit.id,
            unitType: unit.unitType,
            actTitle: unit.actTitle,
            editorialUnit: unit.editorialUnit,
            content: unit.content,
            sourceUrl: unit.sourceUrl,
            legalStateDate: unit.legalStateDate,
            contentHashSha256: unit.contentHashSha256,
            status: unit.status,
          });
          allRetrievedUnitIdsSet.add(unit.id);
        } else {
          missingRequiredSources.push(`${checklistItem.id} -> ${sourceId}`);
        }
      }

      // 2. Wyszukiwanie hybrydowe dla wyłapania dodatkowego kontekstu orzeczniczego lub UOKiK
      const hybridMatches = hybridSearch.search(`${clause.clauseNumber} ${clause.fullText}`, {
        contractType: checklistOutput.contractType,
        contractDate,
        limit: 3,
        minScoreThreshold: 0.25,
      });

      for (const hm of hybridMatches) {
        if (!retrievedUnitsMap.has(hm.unit.id)) {
          retrievedUnitsMap.set(hm.unit.id, {
            id: hm.unit.id,
            unitType: hm.unit.unitType,
            actTitle: hm.unit.actTitle,
            editorialUnit: hm.unit.editorialUnit,
            content: hm.unit.content,
            sourceUrl: hm.unit.sourceUrl,
            legalStateDate: hm.unit.legalStateDate,
            contentHashSha256: hm.unit.contentHashSha256,
            status: hm.unit.status,
          });
          allRetrievedUnitIdsSet.add(hm.unit.id);
        }
      }

      contexts.push({
        clauseId,
        checklistItemId: checklistItem.id,
        retrievedUnits: Array.from(retrievedUnitsMap.values()),
      });
    }
  }

  return {
    contexts,
    allRetrievedUnitIds: Array.from(allRetrievedUnitIdsSet),
    missingRequiredSources: Array.from(new Set(missingRequiredSources)),
  };
}
