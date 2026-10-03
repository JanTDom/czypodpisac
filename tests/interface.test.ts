import { describe, it, expect } from "vitest";
import { POST as analyzeHandler } from "../src/app/api/analyze/route";
import { POST as blikHandler } from "../src/app/api/paywall/blik/route";
import { POST as feedbackPostHandler, GET as feedbackGetHandler } from "../src/app/api/feedback/route";
import { NextRequest } from "next/server";
import { PipelineOrchestrator } from "../src/pipeline/orchestrator";
import { LegalKnowledgeBase } from "../src/kb";
import { ChecklistRegistry } from "../src/checklists/registry";

describe("Interfejs i API czypodpisac.pl (Etap 4)", () => {
  const sampleContract = `
UMOWA NAJMU LOKALU MIESZKALNEGO
Jan Kowalski, Wynajmujący i Piotr Nowak, Najemca.
§ 1. Przedmiotem umowy jest lokal mieszkalny nr 5 w Warszawie.
§ 2. Czynsz najmu wynosi 3000 zł miesięcznie.
§ 3. Kaucja zabezpieczająca wynosi 45000 zł.
§ 4. Wypowiedzenie przez Najemcę skutkuje karą umowną w kwocie 5000 zł.
§ 5. Spory rozstrzyga sąd właściwy dla Wynajmującego.
`.trim();

  describe("API /api/analyze", () => {
    it("odrzuca puste zapytanie z błędem 400 i czytelnym komunikatem", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({ contractText: "   " }),
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Brak treści umowy do analizy.");
    });

    it("zwraca darmowy wynik (werdykt + 3 ryzyka) dla zapytania darmowego", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          contractText: sampleContract,
          fileName: "umowa_najmu.txt",
          isPaid: false,
        }),
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.analysisId).toBeDefined();
      expect(json.freeTier).toBeDefined();
      expect(json.freeTier.verdictOneSentence).toContain("PODPISZ PO ZMIANACH");
      expect(json.freeTier.topRisks.length).toBeLessThanOrEqual(3);
      expect(json.report).toBeDefined();
      expect(json.report.counts.red).toBeGreaterThanOrEqual(1);
    });

    it("silnik generuje poprawki i mail dla pełnego raportu (API wydaje go dopiero po płatności, B7)", async () => {
      const orchestrator = new PipelineOrchestrator(LegalKnowledgeBase.getInstance(), ChecklistRegistry.getInstance());
      const json = await orchestrator.runFullPipeline({ contractText: sampleContract, fileName: "umowa_najmu.txt" });
      expect(json.generation).toBeDefined();
      expect(json.generation.amendments.length).toBeGreaterThan(0);
      expect(json.generation.negotiationEmail).toBeDefined();
      expect(json.generation.negotiationEmail.subject).toContain("najem");
      expect(json.generation.negotiationEmail.mailtoUrl).toContain("mailto:?subject=");
    });
  });

  describe("API /api/paywall/blik", () => {
    it("odrzuca niepoprawny kod BLIK lub brak e-maila", async () => {
      const reqInvalidCode = new NextRequest("http://localhost:3000/api/paywall/blik", {
        method: "POST",
        body: JSON.stringify({ blikCode: "123", email: "test@example.com" }),
      });
      const res1 = await blikHandler(reqInvalidCode);
      expect(res1.status).toBe(400);

      const reqMissingEmail = new NextRequest("http://localhost:3000/api/paywall/blik", {
        method: "POST",
        body: JSON.stringify({ blikCode: "777888", email: "" }),
      });
      const res2 = await blikHandler(reqMissingEmail);
      expect(res2.status).toBe(400);
    });

    it("nie potwierdza płatności, bo bramka BLIK nie jest podłączona (B7)", async () => {
      const req = new NextRequest("http://localhost:3000/api/paywall/blik", {
        method: "POST",
        body: JSON.stringify({
          blikCode: "777 888",
          email: "najemca@example.pl",
          analysisId: "test-doc-123",
        }),
      });

      const res = await blikHandler(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBeUndefined();
      expect(json.transactionId).toBeUndefined();
    });
  });

  describe("API /api/feedback (sygnały jakości)", () => {
    it("zapisuje zgłoszenie 'Nie zgadzam się' i zwraca listę w panelu", async () => {
      const postReq = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          findingId: "finding-kaucja-1",
          reason: "Wynajmujący poinformował, że kaucję obniżył ustnie.",
          contractType: "najem_lokalu_mieszkalnego",
        }),
      });

      const postRes = await feedbackPostHandler(postReq);
      expect(postRes.status).toBe(201);

      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);
      expect(postJson.feedbackId).toBeDefined();

      const getRes = await feedbackGetHandler();
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.total).toBeGreaterThanOrEqual(1);
      expect(getJson.items.some((i: any) => i.findingId === "finding-kaucja-1")).toBe(true);
    });
  });
});
