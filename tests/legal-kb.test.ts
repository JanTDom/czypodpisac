import { describe, it, expect } from "vitest";
import * as crypto from "node:crypto";
import {
  LegalKnowledgeBase,
  HybridLegalSearch,
  CORE_ACTS_REGISTRY,
  LayerBService,
  EliApiClient,
} from "../src/kb";

describe("Weryfikacja bazy wiedzy prawnej legal-kb/", () => {
  const kb = LegalKnowledgeBase.getInstance();

  it("Pomyślnie ładuje indeks oraz wszystkie jednostki", () => {
    const index = kb.getIndex();
    expect(index.totalUnits).toBeGreaterThanOrEqual(50);
    expect(index.unitsByType.statute).toBeGreaterThanOrEqual(40);
    expect(index.unitsByType.uokik_clause).toBeGreaterThanOrEqual(5);
    expect(index.unitsByType.court_ruling).toBeGreaterThanOrEqual(4);
  });

  it("Weryfikuje autentyczność jednostki art. 6 UoPL (kaucja)", () => {
    const unit = kb.getById("uopl-art-6");
    expect(unit).toBeDefined();
    expect(unit?.editorialUnit).toBe("art. 6");
    expect(unit?.publicationAddress).toBe("Dz.U. 2023 poz. 725");
    expect(unit?.content).toContain("dwunastokrotności miesięcznego czynszu");
    expect(unit?.legalStateDate).toBe("2023-03-09");
    expect(unit?.status).toBe("active");

    // Sprawdzenie sumy kontrolnej SHA-256
    const calculatedHash = crypto.createHash("sha256").update(unit!.content, "utf8").digest("hex");
    expect(unit?.contentHashSha256).toBe(calculatedHash);
  });

  it("Weryfikuje autentyczność jednostki art. 385¹ k.c. (klauzule abuzywne)", () => {
    const unit = kb.getById("kc-art-385-1");
    expect(unit).toBeDefined();
    expect(unit?.editorialUnit).toBe("art. 385¹");
    expect(unit?.publicationAddress).toBe("Dz.U. 2024 poz. 1061");
    expect(unit?.content).toContain("sprzeczny z dobrymi obyczajami, rażąco naruszając jego interesy");
    expect(unit?.legalStateDate).toBe("2024-06-19");
    expect(unit?.status).toBe("active");

    const calculatedHash = crypto.createHash("sha256").update(unit!.content, "utf8").digest("hex");
    expect(unit?.contentHashSha256).toBe(calculatedHash);
  });

  it("Odrzuca nieistniejące lub zmyślone źródła prawne", () => {
    expect(kb.hasValidSource("kc-art-999-zmyslony")).toBe(false);
    expect(kb.hasValidSource("uokik-zmyslony-wpis")).toBe(false);
    expect(kb.getById("kc-art-999-zmyslony")).toBeUndefined();
  });

  it("Zwraca jednostki dla najmu lokalu mieszkalnego", () => {
    const units = kb.getByContractType("najem_lokalu_mieszkalnego");
    expect(units.length).toBeGreaterThanOrEqual(40);
    const hasUopl6 = units.some((u) => u.id === "uopl-art-6");
    const hasKc385 = units.some((u) => u.id === "kc-art-385-1");
    expect(hasUopl6).toBe(true);
    expect(hasKc385).toBe(true);
  });

  it("Wyszukuje po słowie kluczowym 'kaucja'", () => {
    const results = kb.searchByKeywords("kaucja", "najem_lokalu_mieszkalnego");
    expect(results.length).toBeGreaterThan(0);
    const foundUopl6 = results.find((r) => r.id === "uopl-art-6");
    expect(foundUopl6).toBeDefined();
  });

  it("Wyszukuje orzecznictwo i klauzule UOKiK dla wypowiedzenia", () => {
    const results = kb.searchByKeywords("wypowiedzenie", "najem_lokalu_mieszkalnego");
    expect(results.length).toBeGreaterThan(0);
    const hasSn = results.some((r) => r.id === "sn-iii-czp-11-13");
    expect(hasSn).toBe(true);
  });

  describe("Wersjonowanie w czasie (Time-versioning)", () => {
    it("Prawidłowo ocenia obowiązywanie przepisu na dzień podpisania umowy", () => {
      // Przepis art. 6 UoPL w stanie prawnym z 2023-03-09
      const result2024 = kb.getUnitAtDate("uopl-art-6", "2024-01-01");
      expect(result2024.isInForceAtDate).toBe(true);
      expect(result2024.statusAtDate).toBe("in_force");

      // Przed datą wejścia w życie danej nowelizacji
      const resultPast = kb.getUnitAtDate("uopl-art-6", "2000-01-01");
      expect(resultPast.isInForceAtDate).toBe(false);
      expect(resultPast.statusAtDate).toBe("not_yet_in_force");
      expect(resultPast.warningMessage).toContain("wszedł w życie");
    });

    it("searchAtDate zwraca adnotację o stanie prawnym na dzień umowy", () => {
      const results = kb.searchAtDate("kaucja", "2024-05-01", "najem_lokalu_mieszkalnego");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].wasInForce).toBe(true);
    });
  });

  describe("Wyszukiwanie hybrydowe (HybridLegalSearch)", () => {
    it("Zwraca uszeregowane wyniki z łącznym wynikiem leksykalnym i wektorowym", () => {
      const hybrid = new HybridLegalSearch(kb);
      const results = hybrid.search("kaucja mieszkaniowa limit zwrot", {
        contractType: "najem_lokalu_mieszkalnego",
        contractDate: "2024-01-01",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].unit.id).toBe("uopl-art-6");
      expect(results[0].combinedScore).toBeGreaterThan(0.3);
      expect(results[0].lexicalScore).toBeGreaterThan(0);
      expect(results[0].vectorScore).toBeGreaterThan(0);
      expect(results[0].wasInForceAtContractDate).toBe(true);
    });
  });

  describe("Warstwa A: Rejestr 17 aktów Rdzenia (CORE_ACTS_REGISTRY)", () => {
    it("Zawiera kompletne 17 aktów prawnych zdefiniowanych w regule 02", () => {
      expect(CORE_ACTS_REGISTRY.length).toBe(17);

      const actIds = CORE_ACTS_REGISTRY.map((a: any) => a.id);
      expect(actIds).toContain("kc");
      expect(actIds).toContain("uopl");
      expect(actIds).toContain("uokik-konsument");
      expect(actIds).toContain("deweloperska");
      expect(actIds).toContain("kredyt-konsumencki");
      expect(actIds).toContain("kredyt-hipoteczny");
      expect(actIds).toContain("zatory-platnicze");
      expect(actIds).toContain("prawo-autorskie");
      expect(actIds).toContain("kp");
      expect(actIds).toContain("ubezpieczeniowa");
      expect(actIds).toContain("uslugi-platnicze");
      expect(actIds).toContain("pke");
      expect(actIds).toContain("uslugi-turystyczne");
      expect(actIds).toContain("prawo-energetyczne");
      expect(actIds).toContain("rodo-uodo");
      expect(actIds).toContain("ksh");
      expect(actIds).toContain("kpc");

      // Każdy akt posiada unikalny identyfikator bazowy ELI Sejmu
      for (const act of CORE_ACTS_REGISTRY) {
        expect(act.baseEliId).toMatch(/^DU\/\d{4}\/\d+$/);
      }
    });
  });

  describe("Warstwa B: Serwis pobierania aktów na żądanie (LayerBService)", () => {
    it("Rozpoznaje akty należące do rdzenia i spoza rdzenia", () => {
      const layerB = new LayerBService();

      expect(layerB.isCoreAct("DU/1964/93")).toBe(true); // Kodeks cywilny
      expect(layerB.isCoreAct("DU/2001/733")).toBe(true); // UoPL
      expect(layerB.isCoreAct("DU/2012/1234")).toBe(false); // Inny akt
    });

    it("Pobiera akt na żądanie, dzieli na jednostki i oznacza jako nieprzejrzane przez prawnika", async () => {
      const mockEliClient = new EliApiClient({
        mockFetcher: async (url: string) => {
          if (url.includes("/text.html")) {
            return `<html><body><h1>Ustawa z dnia 1 stycznia 2020 r.</h1><p>Art. 1. Przepisy ogólne niniejszej ustawy określają zasady przewozu.</p><p>Art. 2. Umowa przewozu wymaga formy pisemnej.</p></body></html>`;
          }
          return {
            ELI: "DU/2020/555",
            title: "Ustawa o transporcie drogowym",
            publisher: "DU",
            year: 2020,
            pos: 555,
            status: "obowiązujący",
            inForce: "IN_FORCE",
            announcementDate: "2020-01-15",
          };
        },
      });

      const layerB = new LayerBService(mockEliClient);
      const result = await layerB.ingestOnDemandAct("DU/2020/555");

      expect(result.actTitle).toBe("Ustawa o transporcie drogowym");
      expect(result.unitsCreated.length).toBe(2);
      expect(result.unitsCreated[0].editorialUnit).toBe("art. 1");
      expect(result.unitsCreated[0].status).toBe("needs_review"); // nieprzejrzane przez prawnika
      expect(result.unitsCreated[0].contractTypeTags).toContain("warstwa_b");
      expect(result.disclaimerNotice).toContain("nie zostały jeszcze indywidualnie zweryfikowane przez prawnika");
    });
  });
});
