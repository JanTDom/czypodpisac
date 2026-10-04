import * as crypto from "node:crypto";
import { ClassificationOutput } from "../schemas/stage02-classification";
import { ChecklistOutput } from "../schemas/stage04-checklist";
import { ValidationOutput, ValidatedFinding } from "../schemas/stage07-validation";
import { BenchmarkOutput } from "../schemas/stage08-benchmark";
import {
  AggregatedReport,
  MissingClauseReportItem,
  NextActionRecommendation,
} from "../schemas/stage09-aggregation";
import { ChecklistRegistry } from "../../checklists/registry";

/**
 * Etap 9: Agregacja raportu, wyliczenie kwot ryzyka i deterministyczny werdykt
 * Zgodnie ze skillem silnik-analizy (kroki 9 i 11):
 * - Kwoty liczy kod na podstawie wartości z umowy i scenariusza; zawsze z założeniami.
 * - Werdykt oparty jest na regułach deterministycznych, nie na swobodnej decyzji modelu.
 * - Format werdyktu: PODPISZ / PODPISZ PO ZMIANACH / NIE PODPISUJ BEZ PRAWNIKA.
 */
export async function executeAggregation(
  analysisId: string,
  classification: ClassificationOutput,
  checklist: ChecklistOutput,
  validation: ValidationOutput,
  benchmark: BenchmarkOutput,
  registry: ChecklistRegistry = ChecklistRegistry.getInstance()
): Promise<AggregatedReport> {
  const redFindings: ValidatedFinding[] = [];
  const yellowFindings: ValidatedFinding[] = [];
  const greenFindings: ValidatedFinding[] = [];

  // 1. Podział zweryfikowanych uwag wg kolorów
  for (const f of validation.verifiedFindings) {
    if (f.ocena === "czerwony") {
      redFindings.push(f);
    } else if (f.ocena === "żółty") {
      yellowFindings.push(f);
    } else if (f.ocena === "zielony") {
      greenFindings.push(f);
    }
  }

  // 2. Identyfikacja brakujących klauzul (braki w umowie)
  const missingItems: MissingClauseReportItem[] = [];
  for (const m of checklist.matches) {
    if (m.isMissing && m.missingRiskSeverity !== "none") {
      const item = registry.getItemById(m.checklistItemId);
      if (!item) continue;

      missingItems.push({
        id: crypto.randomUUID(),
        checklistItemId: item.id,
        title: `Brakujące postanowienie: ${item.area}`,
        severity: m.missingRiskSeverity === "red" ? "czerwony" : "żółty",
        whyImportant: `Umowa nie reguluje zagadnienia '${item.area.toLowerCase()}'. ${item.controlQuestion}`,
        recommendedClauseText: `Zaleca się wprowadzenie zapisu: Strony ustalają, że kwestie dotyczące ${item.area.toLowerCase()} podlegają właściwym przepisom Kodeksu cywilnego oraz bezwzględnie obowiązującym normom prawnym.`,
        sourceIds: item.kbSourceIds,
      });
    }
  }

  // 3. Precyzyjne sumowanie kwot ryzyka finansowego
  let totalRiskAmount: number | undefined;
  const assumptionsParts: string[] = [];

  for (const f of [...redFindings, ...yellowFindings]) {
    if (f.kwotaRyzyka && f.kwotaRyzyka > 0) {
      totalRiskAmount = (totalRiskAmount || 0) + f.kwotaRyzyka;
      if (f.zalozeniaKwoty) {
        assumptionsParts.push(`${f.tytulPoLudzku}: ${f.zalozeniaKwoty}`);
      }
    }
  }

  const totalRiskAssumptions =
    assumptionsParts.length > 0
      ? assumptionsParts.join(" | ")
      : totalRiskAmount
      ? "Suma bezpośrednich kwot wynikających z postanowień umowy naruszających przepisy lub standardy rynkowe."
      : undefined;

  // 4. Deterministyczny werdykt i rekomendacja działania
  const redCount = redFindings.length;
  const yellowCount = yellowFindings.length;
  const missingCriticalCount = missingItems.filter((i) => i.severity === "czerwony").length;
  const totalCriticalRed = redCount + missingCriticalCount;

  let verdictOneSentence: string;
  let recommendedAction: NextActionRecommendation;

  const isUnknownOrNoChecklist =
    classification.contractType === "inna_nieznana" ||
    !registry.hasChecklist(classification.contractType) ||
    checklist.matches.length === 0;

  if (totalCriticalRed >= 4 || (totalRiskAmount && totalRiskAmount >= 50000)) {
    verdictOneSentence = "NIE PODPISUJ BEZ PRAWNIKA: Wykryto liczne niedozwolone klauzule i wysokie ryzyko finansowe.";
    recommendedAction = "skonsultuj_z_prawnikiem";
  } else if (totalCriticalRed > 0) {
    const keyRiskTitles = redFindings.slice(0, 2).map((r) => r.tytulPoLudzku.toLowerCase()).join(" oraz ");
    verdictOneSentence = `PODPISZ PO ZMIANACH: Przed podpisaniem bezwzględnie zmień zapisy (${keyRiskTitles || "wykryte klauzule wysokiego ryzyka"}).`;
    recommendedAction = "popros_o_zmiany";
  } else if (yellowCount > 0) {
    // Brak uwag czerwonych, są tylko żółte uwagi
    verdictOneSentence = "PODPISZ PO ZMIANACH: Umowa jest ogólnie poprawna, ale wymaga doprecyzowania kilku postanowień.";
    recommendedAction = "popros_o_zmiany";
  } else if (isUnknownOrNoChecklist) {
    // Brak uwag czerwonych i żółtych, ale umowa jest nietypowa lub nie posiada certyfikowanej checklisty w bazie
    verdictOneSentence = "DO WERYFIKACJI Z PRAWNIKIEM: Umowa nietypowa. Nie wykryto rażących pułapek ogólnych, ale wymaga indywidualnej oceny prawnika.";
    recommendedAction = "skonsultuj_z_prawnikiem";
  } else {
    // Sprawdzona certyfikowana checklista, brak jakichkolwiek naruszeń
    verdictOneSentence = "PODPISZ: Umowa jest bezpieczna i nie zawiera klauzul abuzywnych ani istotnych ryzyk.";
    recommendedAction = "mozesz_podpisac";
  }

  return {
    analysisId,
    contractType: classification.contractType,
    userRole: classification.userRole,
    partyStatus: classification.partyStatus,
    verdictOneSentence,
    counts: {
      red: redFindings.length,
      yellow: yellowFindings.length,
      missing: missingItems.length,
      green: greenFindings.length,
    },
    totalRiskAmount,
    totalRiskAssumptions,
    recommendedAction,
    findings: {
      red: redFindings,
      yellow: yellowFindings,
      missing: missingItems,
      green: greenFindings,
    },
    benchmarks: benchmark.comparisons,
    meta: {
      aiGeneratedDisclaimer:
        "Niniejsza analiza została wygenerowana przy użyciu systemu sztucznej inteligencji czypodpisac.pl i ma charakter informacyjny. Nie stanowi pomocy prawnej w rozumieniu ustawy o radcach prawnych.",
      analyzedAt: new Date().toISOString(),
      legalKbVersion: "2026.1-eli",
      checklistVersion: "2026.1",
    },
  };
}
