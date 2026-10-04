import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PipelineOrchestrator } from "../src/pipeline/orchestrator";

describe("Regresja: Kwalifikacja umowy zlecenia z cechami stosunku pracy i klauzulami abuzywnymi", () => {
  it("wykrywa cechy stosunku pracy (art. 22 k.p.), kary umowne i asymetrię dając werdykt NIE PODPISUJ", async () => {
    const text = readFileSync("test-contracts/regresja/zlecenie-redakcja-cechy-pracy.txt", "utf8");
    const orchestrator = new PipelineOrchestrator();

    const result = await orchestrator.runFastVerdict({
      contractText: text,
      fileName: "umowa_zlecenia_redakcja.txt",
    });

    // 1. Klasyfikacja
    expect(result.classification.contractType).toBe("zlecenie");
    expect(result.classification.userRole).toBe("wykonawca");

    // 2. Werdykt: twardy czerwony z zaleceniem prawnika
    expect(result.freeTier.verdictOneSentence).toContain("NIE PODPISUJ BEZ PRAWNIKA");
    expect(result.freeTier.recommendedAction).toBe("skonsultuj_z_prawnikiem");

    // 3. Wykryte kluczowe ryzyka
    const redTitles = result.report.findings.red.map((f) => f.tytulPoLudzku);
    expect(redTitles).toContain("Umowa zlecenia zawiera kluczowe cechy umowy o pracę (art. 22 k.p.)");
    expect(redTitles).toContain("Nieodpłatny zakaz konkurencji z wysoką karą umowną");
    expect(redTitles).toContain("Wygórowana kara umowna za naruszenie poufności");
    expect(redTitles).toContain("Asymetryczne natychmiastowe rozwiązanie zlecenia (utrata zaufania)");

    // 4. Ryzyko finansowe (kary 20k + 30k = 50k zł)
    expect(result.freeTier.totalRiskAmount).toBe(50000);

    // 5. Podstawy prawne w uwagach są ugruntowane w legal-kb
    const laborFinding = result.report.findings.red.find(f => f.tytulPoLudzku.includes("cechy umowy o pracę"));
    expect(laborFinding).toBeDefined();
    expect(laborFinding?.zweryfikowaneZrodlaIds).toContain("kp-art-22");
    expect(laborFinding?.geminiVerifierVerdict).toBe("popiera");
    expect(laborFinding?.cytatZweryfikowany).toBe(true);
  });
});
