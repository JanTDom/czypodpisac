import * as fs from "node:fs";
import * as path from "node:path";
import { LegalKnowledgeBase } from "../src/kb";
import { EliApiClient } from "../src/kb/eli-client";
import { LawFreshnessGuard } from "../src/kb/freshness-guard";
import { ChecklistRegistry } from "../src/checklists/registry";

async function main() {
  console.log("================================================================================");
  console.log("UMOWA.CHECK — MONITORING I AUDYT AKTUALNOŚCI PRAWA (API SEJMU ELI)");
  console.log("================================================================================");

  const kb = LegalKnowledgeBase.getInstance();
  const registry = ChecklistRegistry.getInstance();
  const eliClient = new EliApiClient();
  const guard = LawFreshnessGuard.getInstance(eliClient);

  console.log(`Załadowano ${kb.getAllUnits().length} jednostek prawnych z legal-kb/.`);
  console.log("Rozpoczynanie weryfikacji w oficjalnym API Sejmu RP (https://api.sejm.gov.pl/eli)...");

  const report = await guard.auditKnowledgeBase(kb, registry, eliClient);

  console.log("\n--------------------------------------------------------------------------------");
  console.log("PODSUMOWANIE AUDYTU AKTUALNOŚCI:");
  console.log(`- Przeanalizowano jednostek: ${report.totalAudited}`);
  console.log(`- W 100% aktualne (in force, brak nowych nowelizacji): ${report.upToDateCount}`);
  console.log(`- Wymagające weryfikacji / po nowelizacji: ${report.needsReviewCount}`);
  console.log(`- Uchylone: ${report.repealedCount}`);
  console.log(`- Dotknięte punkty checklist kontrolnych: ${report.affectedChecklistCount}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (report.needsReviewCount > 0 || report.repealedCount > 0) {
    console.log("WYKRYTE ZMIANY LUB KONIECZNOŚĆ WERYFIKACJI:");
    for (const item of report.auditResults) {
      if (!item.isUpToDate) {
        console.log(`[!] ${item.unitId} (${item.editorialUnit}):`);
        console.log(`    Status: ${item.currentStatus} | Rekomendacja: ${item.recommendedAction}`);
        for (const reason of item.reasons) {
          console.log(`    -> ${reason}`);
        }
        if (item.affectedChecklistItems.length > 0) {
          console.log(`    -> Zależne punkty checklist: ${item.affectedChecklistItems.join(", ")}`);
        }
      }
    }
  } else {
    console.log("Wszystkie zweryfikowane przepisy są aktualne.");
  }

  // Zapis raportu do docs/eval/law-freshness-audit.json
  const auditReportPath = path.resolve(process.cwd(), "docs/eval/law-freshness-audit.json");
  fs.mkdirSync(path.dirname(auditReportPath), { recursive: true });
  fs.writeFileSync(auditReportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\nZapisano pełny raport audytu: ${auditReportPath}`);
}

main().catch((err) => {
  console.error("Błąd podczas audytu aktualności prawa:", err);
  process.exit(1);
});
