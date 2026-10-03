import { describe, it, expect } from "vitest";
import * as crypto from "node:crypto";
import { LegalKnowledgeBase } from "../src/kb";

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
});
