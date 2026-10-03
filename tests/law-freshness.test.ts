import { describe, it, expect, beforeEach } from "vitest";
import { EliApiClient } from "../src/kb/eli-client";
import { LawFreshnessGuard, ACT_ELI_MAPPING } from "../src/kb/freshness-guard";
import { LegalKnowledgeBase } from "../src/kb";
import { ChecklistRegistry } from "../src/checklists/registry";
import { LegalKbUnit } from "../src/kb/types";

describe("Czułość na zmiany prawa i synchronizacja z API Sejmu ELI", () => {
  let kb: LegalKnowledgeBase;
  let registry: ChecklistRegistry;

  beforeEach(() => {
    kb = LegalKnowledgeBase.getInstance();
    registry = ChecklistRegistry.getInstance();
  });

  describe("EliApiClient — parsowanie i komunikacja z API Sejmu ELI", () => {
    it("Prawidłowo parsuje identyfikatory ELI aktu (DU/rok/pozycja)", () => {
      const client = new EliApiClient();
      const parsed = client.parseEliId("DU/2001/733");
      expect(parsed).toEqual({
        publisher: "DU",
        year: 2001,
        pos: 733,
      });

      const parsedKc = client.parseEliId("DU/1964/93");
      expect(parsedKc).toEqual({
        publisher: "DU",
        year: 1964,
        pos: 93,
      });
    });

    it("Wyrzuca zrozumiały błąd dla nieprawidłowego formatu ELI", () => {
      const client = new EliApiClient();
      expect(() => client.parseEliId("niepoprawny-identyfikator")).toThrow(
        /Nieprawidłowy format identyfikatora ELI/
      );
    });

    it("Prawidłowo przetwarza odpowiedź z metadanymi aktu z API Sejmu", async () => {
      const mockFetcher = async () => ({
        ELI: "DU/2001/733",
        title: "Ustawa o ochronie praw lokatorów...",
        publisher: "DU",
        year: 2001,
        pos: 733,
        status: "akt posiada tekst jednolity",
        inForce: "IN_FORCE",
        changeDate: "2024-03-15T09:59:44",
        references: {
          "Inf. o tekście jednolitym": [{ id: "DU/2023/725" }, { id: "DU/2022/172" }],
          "Akty zmieniające": [
            { id: "DU/2022/975", date: "2022-01-01" },
            { id: "DU/2024/500", date: "2024-06-01" },
          ],
        },
      });

      const client = new EliApiClient({ mockFetcher });
      const meta = await client.getActMetadata("DU/2001/733");

      expect(meta).not.toBeNull();
      expect(meta?.ELI).toBe("DU/2001/733");
      expect(meta?.status).toBe("akt posiada tekst jednolity");
      expect(meta?.inForce).toBe("IN_FORCE");
      expect(meta?.latestUnifiedTextId).toBe("DU/2023/725");
      expect(meta?.amendingActsCount).toBe(2);
      expect(meta?.recentAmendingActs).toHaveLength(2);
    });

    it("Wykrywa nowsze akty zmieniające ogłoszone po dacie stanu prawnego", async () => {
      const mockFetcher = async () => ({
        ELI: "DU/2001/733",
        title: "Ustawa o ochronie praw lokatorów",
        publisher: "DU",
        year: 2001,
        pos: 733,
        status: "akt posiada tekst jednolity",
        inForce: "IN_FORCE",
        references: {
          "Akty zmieniające": [
            { id: "DU/2022/975", date: "2022-01-01" },
            { id: "DU/2023/700", date: "2023-05-01" },
            { id: "DU/2025/100", date: "2025-02-15" },
          ],
        },
      });

      const client = new EliApiClient({ mockFetcher });
      
      // Stan prawny z 2023-01-01 -> powinien wykryć akty z 2023-05-01 i 2025-02-15
      const checkResult = await client.checkAmendingActsSince("DU/2001/733", "2023-01-01");
      expect(checkResult.hasNewAmendingActs).toBe(true);
      expect(checkResult.newActs).toHaveLength(2);
      expect(checkResult.newActs.map((a) => a.id)).toEqual(["DU/2023/700", "DU/2025/100"]);

      // Stan prawny z 2026-01-01 -> brak nowszych aktów
      const upToDateResult = await client.checkAmendingActsSince("DU/2001/733", "2026-01-01");
      expect(upToDateResult.hasNewAmendingActs).toBe(false);
      expect(upToDateResult.newActs).toHaveLength(0);
    });
  });

  describe("LawFreshnessGuard — audyt świeżości i kaskada unieważniania", () => {
    it("Zawiera mapowania ELI dla kluczowych polskich aktów prawnych", () => {
      expect(ACT_ELI_MAPPING["ochronie praw lokatorów"].baseEli).toBe("DU/2001/733");
      expect(ACT_ELI_MAPPING["kodeks cywilny"].baseEli).toBe("DU/1964/93");
      expect(ACT_ELI_MAPPING["kodeks pracy"].baseEli).toBe("DU/1974/141");
    });

    it("Audyt jednostki: wykrywa aktualny stan prawny gdy brak nowelizacji", async () => {
      const mockFetcher = async () => ({
        ELI: "DU/2001/733",
        title: "Ustawa o ochronie praw lokatorów",
        publisher: "DU",
        year: 2001,
        pos: 733,
        status: "akt posiada tekst jednolity",
        inForce: "IN_FORCE",
        references: {
          "Inf. o tekście jednolitym": [{ id: "DU/2023/725" }],
          "Akty zmieniające": [{ id: "DU/2022/975", date: "2022-01-01" }],
        },
      });

      const client = new EliApiClient({ mockFetcher });
      const guard = new LawFreshnessGuard(client);

      const testUnit: LegalKbUnit = {
        id: "test-uopl-art-6",
        unitType: "statute",
        actTitle: "Ustawa z dnia 21 czerwca 2001 r. o ochronie praw lokatorów...",
        editorialUnit: "art. 6",
        content: "Treść art. 6",
        sourceUrl: "https://api.sejm.gov.pl/eli/acts/DU/2001/733",
        fetchDate: "2026-10-01",
        legalStateDate: "2023-03-09", // stan po nowelizacji z 2022
        contentHashSha256: "a".repeat(64),
        status: "active",
        contractTypeTags: ["najem_lokalu_mieszkalnego"],
        keywords: ["kaucja"],
      };

      const result = await guard.auditUnitFreshness(testUnit, registry, client);
      expect(result.isUpToDate).toBe(true);
      expect(result.currentStatus).toBe("active");
      expect(result.recommendedAction).toBe("none");
    });

    it("Audyt jednostki: wykrywa nowelizację w Sejmie i oznacza jako needs_review", async () => {
      const mockFetcher = async () => ({
        ELI: "DU/2001/733",
        title: "Ustawa o ochronie praw lokatorów",
        publisher: "DU",
        year: 2001,
        pos: 733,
        status: "akt posiada tekst jednolity",
        inForce: "IN_FORCE",
        references: {
          "Inf. o tekście jednolitym": [{ id: "DU/2023/725" }],
          "Akty zmieniające": [
            { id: "DU/2022/975", date: "2022-01-01" },
            { id: "DU/2024/999", date: "2024-05-10" }, // nowsza nowelizacja niż stan prawny jednostki!
          ],
        },
      });

      const client = new EliApiClient({ mockFetcher });
      const guard = new LawFreshnessGuard(client);

      const testUnit: LegalKbUnit = {
        id: "uopl-art-6",
        unitType: "statute",
        actTitle: "Ustawa z dnia 21 czerwca 2001 r. o ochronie praw lokatorów...",
        editorialUnit: "art. 6",
        content: "Treść art. 6",
        sourceUrl: "https://api.sejm.gov.pl/eli/acts/DU/2001/733",
        fetchDate: "2026-10-01",
        legalStateDate: "2023-03-09",
        contentHashSha256: "a".repeat(64),
        status: "active",
        contractTypeTags: ["najem_lokalu_mieszkalnego"],
        keywords: ["kaucja"],
      };

      const result = await guard.auditUnitFreshness(testUnit, registry, client);
      expect(result.isUpToDate).toBe(false);
      expect(result.currentStatus).toBe("needs_review");
      expect(result.recommendedAction).toBe("flag_for_lawyer_review");
      expect(result.reasons[0]).toContain("Wykryto 1 aktów zmieniających");
      expect(result.affectedChecklistItems.length).toBeGreaterThan(0);
    });

    it("Kaskadowa unieważnienie (cascadeInvalidate) przestawia powiązane punkty checklist na 'needs_update'", () => {
      const guard = new LawFreshnessGuard();

      // Znajdź punkty checklisty zależne od uopl-art-6 (kaucja)
      const affected = guard.getAffectedChecklistItems("uopl-art-6", registry);
      expect(affected.length).toBeGreaterThan(0);
      expect(affected).toContain("najem_lokalu_mieszkalnego::najem-kaucja-limit");

      // Wykonaj kaskadowe unieważnienie
      const result = guard.cascadeInvalidate("uopl-art-6", registry);
      expect(result.updatedCount).toBeGreaterThan(0);

      // Sprawdź czy punkt w rejestrze ma status 'needs_update'
      const item = registry.getItemById("najem-kaucja-limit");
      expect(item?.lawyerReviewStatus).toBe("needs_update");
    });
  });

  describe("LegalKnowledgeBase — metody wyszukiwania aktualnego prawa (findCurrentLaw)", () => {
    it("Metoda isFresh() weryfikuje aktualność jednostki", () => {
      expect(kb.isFresh("uopl-art-6")).toBe(true);
      expect(kb.isFresh("nieistniejacy-artykul")).toBe(false);
    });

    it("findCurrentLaw() zwraca wyłącznie jednostki o statusie 'active'", () => {
      // Domyślnie wyszukujemy 'kaucja'
      const activeResultsBefore = kb.findCurrentLaw("kaucja");
      expect(activeResultsBefore.length).toBeGreaterThan(0);
      expect(activeResultsBefore.every((u) => u.status === "active")).toBe(true);

      // Tymczasowo oznacz uopl-art-6 jako 'needs_review' (np. po wykryciu nowelizacji)
      kb.setUnitStatus("uopl-art-6", "needs_review", "Wykryto nowelizację w Sejmie RP");

      // findCurrentLaw() nie powinno teraz zwrócić uopl-art-6 jako pewnego, obowiązującego prawa!
      const activeResultsAfter = kb.findCurrentLaw("kaucja");
      const foundUopl6 = activeResultsAfter.find((u) => u.id === "uopl-art-6");
      expect(foundUopl6).toBeUndefined();

      // Gdy wyłączymy filtr onlyActive, jednostka powinna być widoczna z właściwym statusem
      const allResults = kb.findCurrentLaw("kaucja", { onlyActive: false });
      const foundInAll = allResults.find((u) => u.id === "uopl-art-6");
      expect(foundInAll).toBeDefined();
      expect(foundInAll?.status).toBe("needs_review");

      // Przywróć stan początkowy dla innych testów
      kb.setUnitStatus("uopl-art-6", "active");
      expect(kb.isFresh("uopl-art-6")).toBe(true);
    });
  });
});
