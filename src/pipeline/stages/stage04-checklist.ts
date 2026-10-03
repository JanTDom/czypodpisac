import { ContractType } from "../schemas/stage02-classification";
import { SegmentationOutput } from "../schemas/stage03-segmentation";
import { ChecklistOutput, ChecklistMatch } from "../schemas/stage04-checklist";
import { ChecklistRegistry } from "../../checklists/registry";

/**
 * Etap 4: Mapowanie checklisty prawnej
 * Przypisuje klauzule umowy do punktów kontrolnych (Checklista Uniwersalna + Checklista Najmu)
 * oraz identyfikuje brakujące klauzule, których nieobecność rodzi ryzyko prawne.
 */
export async function executeChecklistMapping(
  contractType: ContractType,
  segmentation: SegmentationOutput,
  registry: ChecklistRegistry = ChecklistRegistry.getInstance()
): Promise<ChecklistOutput> {
  const effectiveItems = registry.getEffectiveChecklist(contractType);
  const matches: ChecklistMatch[] = [];
  const matchedClauseIdsSet = new Set<string>();

  for (const item of effectiveItems) {
    const itemKeywords = [
      item.area.toLowerCase(),
      ...item.controlQuestion.toLowerCase().split(/[\s,.;:!?()-]+/).filter((w) => w.length > 3),
    ];

    const matchedClausesForThisItem: string[] = [];

    for (const clause of segmentation.clauses) {
      const clauseText = `${clause.clauseNumber} ${clause.title || ""} ${clause.fullText}`.toLowerCase();
      const hits = itemKeywords.filter((kw) => clauseText.includes(kw));

      // Specyficzne dopasowania pojęciowe dla najczęstszych obszarów:
      const isDepositMatch = item.id.includes("kaucj") && clauseText.includes("kaucj");
      const isTerminationMatch = item.id.includes("wypowiedzeni") && (clauseText.includes("wypowiedze") || clauseText.includes("rozwiązani"));
      const isPenaltyMatch = item.id.includes("kar") && (clauseText.includes("kar") || clauseText.includes("opłat"));
      const isRentMatch = item.id.includes("cen") && (clauseText.includes("czynsz") || clauseText.includes("płatnoś"));
      const isCourtMatch = item.id.includes("sad") && (clauseText.includes("sąd") || clauseText.includes("właściwoś"));
      const isInspectionMatch = item.id.includes("protokol") && (clauseText.includes("protokół") || clauseText.includes("stan lokalu"));

      if (isDepositMatch || isTerminationMatch || isPenaltyMatch || isRentMatch || isCourtMatch || isInspectionMatch || hits.length >= 2) {
        matchedClausesForThisItem.push(clause.id);
        matchedClauseIdsSet.add(clause.id);
      }
    }

    const isMissing = matchedClausesForThisItem.length === 0;
    let missingRiskSeverity: "red" | "yellow" | "none" = "none";

    if (isMissing && item.missingIsRisk) {
      missingRiskSeverity = "yellow";
    }

    matches.push({
      checklistItemId: item.id,
      matchedClauseIds: matchedClausesForThisItem,
      isMissing,
      missingRiskSeverity,
    });
  }

  // Identyfikacja klauzul, które nie pasowały do żadnego punktu checklisty
  const unmatchedClauseIds = segmentation.clauses
    .filter((c) => !matchedClauseIdsSet.has(c.id))
    .map((c) => c.id);

  return {
    contractType,
    totalItemsChecked: effectiveItems.length,
    matches,
    unmatchedClauseIds,
  };
}
