import { describe, it, expect } from "vitest";
import { ChecklistRegistry } from "../src/checklists/registry";
import { ContractChecklistSchema } from "../src/checklists/types";
import { checklistUmowaDeweloperska } from "../src/checklists/umowa-deweloperska";
import { LegalKnowledgeBase } from "../src/kb";
import { PipelineOrchestrator } from "../src/pipeline/orchestrator";
import {
  evaluateDeveloperContract,
  detectTotalPrice,
  RESERVATION_FEE_MAX_SHARE,
  DEFECT_REMOVAL_MAX_DAYS,
  DEFECT_RESPONSE_MAX_DAYS,
  BUYER_EXTRA_TERM_DAYS,
  DEVELOPER_PAYMENT_NOTICE_MIN_DAYS,
} from "../src/pipeline/rules/umowa-deweloperska-rules";

const kb = LegalKnowledgeBase.getInstance();
const clause = (fullText: string, id = "c1") => ({ id, fullText });
const itemsOf = (text: string) => evaluateDeveloperContract([clause(text)]).map((e) => e.checklistItemId);

describe("Umowa deweloperska: baza prawna", () => {
  it("jednostki dew-* pochodzą z tekstu jednolitego Dz.U. 2026 poz. 880 i mają stan prawny 2026-06-09", () => {
    const units = kb.getByContractType("umowa_deweloperska").filter((u) => u.id.startsWith("dew-"));
    expect(units.length).toBe(23);
    for (const u of units) {
      expect(u.publicationAddress).toBe("Dz.U. 2026 poz. 880");
      expect(u.legalStateDate).toBe("2026-06-09");
      expect(u.sourceUrl).toBe("https://api.sejm.gov.pl/eli/acts/DU/2026/880/text.pdf");
      expect(u.status).toBe("active");
    }
  });

  it("progi w regułach odpowiadają brzmieniu przepisów zapisanych w legal-kb", () => {
    expect(kb.getById("dew-art-32")?.content).toContain("nie może przekraczać 1 % ceny");
    expect(RESERVATION_FEE_MAX_SHARE).toBe(0.01);
    expect(kb.getById("dew-art-41")?.content).toContain("w terminie 14 dni od dnia podpisania protokołu");
    expect(DEFECT_RESPONSE_MAX_DAYS).toBe(14);
    expect(kb.getById("dew-art-41")?.content).toContain("w terminie 30 dni od dnia podpisania protokołu");
    expect(DEFECT_REMOVAL_MAX_DAYS).toBe(30);
    expect(kb.getById("dew-art-43")?.content).toContain("120-dniowy termin");
    expect(BUYER_EXTRA_TERM_DAYS).toBe(120);
    expect(kb.getById("dew-art-43")?.content).toContain("w terminie 30 dni od dnia doręczenia wezwania");
    expect(DEVELOPER_PAYMENT_NOTICE_MIN_DAYS).toBe(30);
    expect(kb.getById("dew-art-40")?.content).toContain("w równych częściach dewelopera i nabywcę");
  });
});

describe("Umowa deweloperska: checklista", () => {
  it("jest zgodna ze schematem, wszystkie punkty mają status draft i źródła w legal-kb", () => {
    expect(() => ContractChecklistSchema.parse(checklistUmowaDeweloperska)).not.toThrow();
    const registry = new ChecklistRegistry();
    const grounding = registry.validateChecklistGrounding(checklistUmowaDeweloperska, kb);
    expect(grounding.missingSourceIds).toEqual([]);
    for (const item of checklistUmowaDeweloperska.items) {
      expect(item.lawyerReviewStatus).toBe("draft");
      expect(item.kbSourceIds.every((id) => id.startsWith("dew-"))).toBe(true);
    }
  });

  it("nie jest aktywna w domyślnym rejestrze (czeka na zatwierdzenie prawnika)", () => {
    expect(new ChecklistRegistry().hasChecklist("umowa_deweloperska")).toBe(false);
  });

  it("każdy punkt powołany przez reguły istnieje w checkliście", () => {
    const ids = new Set(checklistUmowaDeweloperska.items.map((i) => i.id));
    const text = [
      "Opłata rezerwacyjna wyniosła 30 000 zł. Cena wynosi 500 000 zł.",
      "Nabywca wpłaci cenę na rachunek bieżący Dewelopera.",
      "Koszty prowadzenia rachunku powierniczego ponosi Nabywca.",
      "W razie odstąpienia od umowy przez Nabywcę Nabywca zapłaci 10 000 zł.",
      "Deweloper może odstąpić od umowy w razie zaległości w zapłacie po wezwaniu z terminem 7 dni.",
      "Nabywca wyznaczy Deweloperowi termin 180 dni na przeniesienie własności, po którym może odstąpić.",
      "Deweloper usunie wady w terminie 90 dni.",
      "Koszty notarialne umowy deweloperskiej w całości ponosi Nabywca.",
      "Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, w formie pisemnej.",
    ].join(" ");
    const findings = evaluateDeveloperContract([clause(text)]);
    expect(findings.length).toBe(9);
    for (const f of findings) expect(ids.has(f.checklistItemId ?? "")).toBe(true);
  });
});

describe("Umowa deweloperska: reguły i granice", () => {
  it("opłata rezerwacyjna równa 1% ceny nie jest uwagą, 1 grosz więcej już tak", () => {
    expect(itemsOf("Cena wynosi 500 000 zł. Opłata rezerwacyjna wynosi 5 000 zł.")).toEqual([]);
    const over = evaluateDeveloperContract([clause("Cena wynosi 500 000 zł. Opłata rezerwacyjna wynosi 5 000,01 zł.")]);
    expect(over.map((f) => f.checklistItemId)).toEqual(["dew-oplata-rezerwacyjna"]);
    expect(over[0].kwotaRyzyka).toBe(0.01);
  });

  it("kwota nadwyżki opłaty rezerwacyjnej jest liczona od ceny całkowitej, nie od ceny za metr", () => {
    const text = "Cena za 1 m2 wynosi 12 000 zł. Cena wynosi 600 000 zł. Opłata rezerwacyjna wynosi 18 000 zł.";
    expect(detectTotalPrice(text)).toBe(600000);
    const [f] = evaluateDeveloperContract([clause(text)]);
    expect(f.kwotaRyzyka).toBe(12000);
  });

  it("bez ceny w umowie opłata rezerwacyjna nie jest oceniana (brak podstawy do liczenia)", () => {
    expect(itemsOf("Opłata rezerwacyjna wynosi 20 000 zł.")).toEqual([]);
  });

  it("wpłaty na rachunek powierniczy są w porządku, na rachunek bieżący — nie", () => {
    expect(itemsOf("Nabywca dokonuje wpłat na otwarty mieszkaniowy rachunek powierniczy nr 12 1020 0000.")).toEqual([]);
    expect(itemsOf("Nabywca zapłaci cenę gotówką w kasie Dewelopera.")).toEqual(["dew-rachunek-powierniczy"]);
  });

  it("usunięcie wad: 30 dni zgodne z ustawą, 31 dni — uwaga", () => {
    expect(itemsOf("Deweloper usunie uznane wady w terminie 30 dni od podpisania protokołu.")).toEqual([]);
    expect(itemsOf("Deweloper usunie uznane wady w terminie 31 dni od podpisania protokołu.")).toEqual(["dew-odbior-i-usuwanie-wad"]);
  });

  it("odpowiedź na wady: 14 dni zgodne z ustawą, 15 dni — uwaga", () => {
    expect(itemsOf("Deweloper poinformuje o uznaniu wad w terminie 14 dni.")).toEqual([]);
    expect(itemsOf("Deweloper poinformuje o uznaniu wad w terminie 15 dni.")).toEqual(["dew-odbior-i-usuwanie-wad"]);
  });

  it("termin dodatkowy przed odstąpieniem nabywcy: 120 dni zgodne, 121 dni — uwaga", () => {
    expect(itemsOf("Nabywca wyznacza Deweloperowi 120 dni na przeniesienie praw, a potem może odstąpić.")).toEqual([]);
    expect(itemsOf("Nabywca wyznacza Deweloperowi 121 dni na przeniesienie praw, a potem może odstąpić.")).toEqual(["dew-termin-przeniesienia-wlasnosci"]);
  });

  it("odstąpienie dewelopera: wezwanie z 30 dniami zgodne, 29 dni lub brak wezwania — uwaga", () => {
    expect(itemsOf("Deweloper może odstąpić od umowy w razie braku zapłaty po wezwaniu do zapłaty w terminie 30 dni.")).toEqual([]);
    expect(itemsOf("Deweloper może odstąpić od umowy w razie braku zapłaty po wezwaniu do zapłaty w terminie 29 dni.")).toEqual(["dew-odstapienie-dewelopera"]);
    expect(itemsOf("Deweloper może odstąpić od umowy bez wezwania, jeżeli Nabywca opóźnia się z zapłatą raty.")).toEqual(["dew-odstapienie-dewelopera"]);
  });

  it("zapłata za odstąpienie nabywcy: kwota w procentach ceny jest przeliczana na złote", () => {
    const [f] = evaluateDeveloperContract([
      clause("Cena wynosi 400 000 zł. W razie odstąpienia od umowy przez Nabywcę Deweloper potrąci 5% ceny."),
    ]);
    expect(f.checklistItemId).toBe("dew-odstapienie-nabywcy");
    expect(f.kwotaRyzyka).toBe(20000);
  });

  it("zwrot wpłat bez potrąceń po odstąpieniu nabywcy nie jest uwagą", () => {
    expect(itemsOf("W razie odstąpienia od umowy przez Nabywcę Deweloper zwróci wpłaty bez potrąceń.")).toEqual([]);
  });

  it("skróty „art.” i „ust.” nie rozbijają zdania (opłata za odstąpienie zostaje wykryta z kwotą)", () => {
    const [f] = evaluateDeveloperContract([
      clause("W przypadkach z art. 43 ust. 1 ustawy Nabywca zapłaci Deweloperowi 10 000 zł za odstąpienie od umowy."),
    ]);
    expect(f.checklistItemId).toBe("dew-odstapienie-nabywcy");
    expect(f.kwotaRyzyka).toBe(10000);
    expect(f.doslownyCytatZUmowy.startsWith("W przypadkach z art. 43 ust. 1")).toBe(true);
  });

  it("odstąpienie dewelopera z powodu braku zapłaty nie jest traktowane jako opłata nabywcy", () => {
    expect(itemsOf("Deweloper może odstąpić od umowy, jeżeli Nabywca nie zapłaci raty mimo wezwania w terminie 30 dni.")).toEqual([]);
  });

  it("koszty notarialne po połowie są zgodne z ustawą; koszty umowy przenoszącej nie są oceniane tą regułą", () => {
    expect(itemsOf("Koszty notarialne umowy deweloperskiej ponoszą Deweloper i Nabywca w równych częściach.")).toEqual([]);
    expect(itemsOf("Koszty notarialne umowy przenoszącej własność ponosi Nabywca.")).toEqual([]);
  });

  it("forma pisemna jest uwagą tylko wtedy, gdy dokument nie wspomina notariusza", () => {
    expect(itemsOf("Umowę sporządzono w formie aktu notarialnego przed notariuszem. Zmiany umowy wymagają formy pisemnej.")).toEqual([]);
    expect(itemsOf("Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.")).toEqual(["dew-forma-aktu-notarialnego"]);
  });

  it("pusta lista klauzul nie daje uwag", () => {
    expect(evaluateDeveloperContract([])).toEqual([]);
  });
});

describe("Umowa deweloperska: integracja z silnikiem", () => {
  const contract = [
    "UMOWA DEWELOPERSKA",
    "§ 1. Deweloper zobowiązuje się wybudować budynek i przenieść na Nabywcę własność lokalu. Cena wynosi 500 000 zł.",
    "§ 2. Nabywca wpłaci cenę na rachunek bieżący Dewelopera.",
  ].join("\n");

  it("w domyślnym rejestrze reguły deweloperskie nie działają (typ nieaktywny)", async () => {
    const result = await new PipelineOrchestrator().runFastVerdict({ contractText: contract });
    expect(result.classification.contractType).toBe("umowa_deweloperska");
    const ids = result.report.findings.red.map((f) => f.checklistItemId);
    expect(ids).not.toContain("dew-rachunek-powierniczy");
  });

  it("po jawnej rejestracji checklisty reguła daje zweryfikowaną uwagę czerwoną", async () => {
    const registry = new ChecklistRegistry();
    registry.registerChecklist(checklistUmowaDeweloperska);
    const result = await new PipelineOrchestrator(kb, registry).runFastVerdict({ contractText: contract });
    const finding = result.report.findings.red.find((f) => f.checklistItemId === "dew-rachunek-powierniczy");
    expect(finding).toBeDefined();
    expect(finding?.cytatZweryfikowany).toBe(true);
    expect(finding?.zweryfikowaneZrodlaIds).toEqual(["dew-art-6", "dew-art-8"]);
  });
});
