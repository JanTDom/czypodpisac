import { describe, it, expect } from "vitest";
import { ChecklistRegistry } from "../src/checklists/registry";
import { LegalKnowledgeBase } from "../src/kb";
import { ChecklistItemSchema } from "../src/checklists/types";

describe("Weryfikacja checklist kontrolnych dla wszystkich rodzajów najmu", () => {
  const registry = ChecklistRegistry.getInstance();
  const kb = LegalKnowledgeBase.getInstance();

  const supportedTenancyTypes = [
    "najem_lokalu_mieszkalnego",
    "najem_okazjonalny",
    "najem_instytucjonalny",
    "najem_lokalu_uzytkowego",
  ] as const;

  it("Rejestr zawiera checklisty dla wszystkich 4 rodzajów najmu", () => {
    for (const contractType of supportedTenancyTypes) {
      const checklist = registry.getChecklist(contractType);
      expect(checklist).toBeDefined();
      expect(checklist?.items.length).toBeGreaterThan(0);
    }
  });

  it("Wszystkie punkty checklist są zgodne ze schematem Zod i mają status 'draft'", () => {
    for (const contractType of supportedTenancyTypes) {
      const checklist = registry.getChecklist(contractType)!;
      for (const item of checklist.items) {
        expect(() => ChecklistItemSchema.parse(item)).not.toThrow();
        expect(item.lawyerReviewStatus).toBe("draft");
        expect(item.kbSourceIds.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("100% źródeł prawnych w checklistach istnieje w legal-kb/ (Zero Zmyślania)", () => {
    for (const contractType of supportedTenancyTypes) {
      const checklist = registry.getChecklist(contractType)!;
      const validation = registry.validateChecklistGrounding(checklist, kb);
      expect(validation.valid, `Brakujące źródła w checkliście ${contractType}: ${validation.missingSourceIds.join(", ")}`).toBe(true);
      expect(validation.missingSourceIds).toHaveLength(0);
    }
  });

  it("Zachowuje rygorystyczne rozróżnienie limitów kaucji między typami najmu", () => {
    // 1. Najem zwykły: limit 12x czynsz (art. 6 UoPL)
    const zwyklyKaucja = registry.getItemById("najem-kaucja-limit");
    expect(zwyklyKaucja?.kbSourceIds).toContain("uopl-art-6");
    expect(zwyklyKaucja?.redCriteria).toContain("12-krotność");

    // 2. Najem okazjonalny: limit 6x czynsz (art. 19c UoPL)
    const okazjonalnyKaucja = registry.getItemById("okazjonalny-kaucja-limit-6x");
    expect(okazjonalnyKaucja?.kbSourceIds).toContain("uopl-art-19c");
    expect(okazjonalnyKaucja?.redCriteria).toContain("6-krotność");

    // 3. Najem instytucjonalny: limit 6x czynsz (art. 19h UoPL)
    const instytucjonalnyKaucja = registry.getItemById("instytucjonalny-kaucja-limit-6x");
    expect(instytucjonalnyKaucja?.kbSourceIds).toContain("uopl-art-19h");
    expect(instytucjonalnyKaucja?.redCriteria).toContain("6-krotność");
  });

  it("Poprawnie weryfikuje wymogi formalne najmu okazjonalnego i instytucjonalnego", () => {
    const okazjonalnyZgloszenie = registry.getItemById("okazjonalny-obowiazek-zgloszenia-us");
    expect(okazjonalnyZgloszenie?.kbSourceIds).toContain("uopl-art-19b");

    const okazjonalnyZastepczy = registry.getItemById("okazjonalny-wskazanie-lokalu-zastepczego");
    expect(okazjonalnyZastepczy?.kbSourceIds).toContain("uopl-art-19a");

    const instytucjonalnyNotariusz = registry.getItemById("instytucjonalny-oswiadczenie-notarialne");
    expect(instytucjonalnyNotariusz?.kbSourceIds).toContain("uopl-art-19g");
  });

  it("Poprawnie weryfikuje specyfikę najmu lokalu użytkowego (art. 687 k.c.)", () => {
    const uzytkowyWypowiedzenie = registry.getItemById("uzytkowy-wypowiedzenie-zaleglosc-art-687");
    expect(uzytkowyWypowiedzenie?.kbSourceIds).toContain("kc-art-687");
    expect(uzytkowyWypowiedzenie?.greenCriteria).toContain("dwa pełne okresy płatności");
  });
});
