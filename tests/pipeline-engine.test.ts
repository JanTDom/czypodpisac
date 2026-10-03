import { describe, it, expect, beforeEach } from "vitest";
import { LegalKnowledgeBase } from "../src/kb";
import { ChecklistRegistry } from "../src/checklists/registry";
import {
  PipelineOrchestrator,
  executeIngest,
  executeClassification,
  executeSegmentation,
  executeChecklistMapping,
  executeRetrieval,
  executeEvaluation,
  executeValidation,
  executeBenchmark,
  executeAggregation,
  executeGeneration,
  AggregatedReportSchema,
  GenerationOutputSchema,
  DeterministicGeminiVerifier,
} from "../src/pipeline";

describe("Silnik analizy umów (Pipeline czypodpisac.pl)", () => {
  let kb: LegalKnowledgeBase;
  let registry: ChecklistRegistry;

  const sampleLeaseContract = `
UMOWA NAJMU LOKALU MIESZKALNEGO

Zawarta w dniu 2026-03-01 w Warszawie pomiędzy:
Janem Kowalskim, PESEL: 85010112345, zamieszkałym w Warszawie, zwanym dalej "Wynajmującym",
a
Piotrem Nowakiem, PESEL: 92020254321, zamieszkałym w Krakowie, zwanym dalej "Najemcą".

§ 1. Przedmiot umowy
1. Wynajmujący oddaje Najemcy do używania lokal mieszkalny nr 5 położony przy ul. Marszałkowskiej 10 w Warszawie.
2. Lokal będzie wykorzystywany wyłącznie na cele mieszkaniowe Najemcy.

§ 2. Czynsz i opłaty
1. Z tytułu najmu Najemca zobowiązuje się płacić Wynajmującemu czynsz w kwocie 3000 zł miesięcznie, płatny z góry do 10. dnia każdego miesiąca.
2. Poza czynszem Najemca ponosi opłaty eksploatacyjne związane z używaniem lokalu.
3. Wynajmujący może jednostronnie zmienić wysokość opłat eksploatacyjnych bez zgody Najemcy w dowolnym czasie.

§ 3. Kaucja zabezpieczająca
1. Tytułem zabezpieczenia ewentualnych roszczeń Wynajmującego, Najemca wpłaci kaucję w kwocie 45000 zł w terminie 3 dni od podpisania umowy.
2. Kaucja zostanie zwrócona po zakończeniu najmu.

§ 4. Okres trwania umowy i rozwiązanie
1. Umowa zostaje zawarta na czas oznaczony jednego roku, od dnia 1 kwietnia 2026 r. do dnia 31 marca 2027 r.
2. W przypadku wcześniejszego wypowiedzenia umowy przez Najemcę, Wynajmujący naliczy karę umowną w kwocie 5000 zł tytułem odstępnego.

§ 5. Postanowienia końcowe
1. Wszelkie spory wynikające z umowy rozstrzygać będzie sąd właściwy dla miejsca zamieszkania Wynajmującego.
2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.
`.trim();

  beforeEach(() => {
    kb = LegalKnowledgeBase.getInstance();
    registry = ChecklistRegistry.getInstance();
  });

  describe("Etap 1: Ingest", () => {
    it("prawidłowo przetwarza tekst umowy, tworzy strony, bloki i sumę sha256", async () => {
      const output = await executeIngest({
        analysisId: "test-ingest-1",
        fileName: "umowa_najmu.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });

      expect(output.analysisId).toBe("test-ingest-1");
      expect(output.fileName).toBe("umowa_najmu.txt");
      expect(output.fullText).toBe(sampleLeaseContract);
      expect(output.pageCount).toBeGreaterThanOrEqual(1);
      expect(output.contentHashSha256).toHaveLength(64);
      expect(output.pages[0].blocks.length).toBeGreaterThan(0);
      expect(output.pages[0].blocks[0].boundingBox).toBeDefined();
    });

    it("odrzuca pusty dokument z czytelnym komunikatem błędu", async () => {
      await expect(
        executeIngest({
          analysisId: "test-empty",
          fileName: "pusty.txt",
          mimeType: "text/plain",
          rawTextContent: "   \n\t  ",
        })
      ).rejects.toThrow("Dokument jest pusty");
    });
  });

  describe("Etap 2: Klasyfikacja", () => {
    it("automatycznie rozpoznaje umowę najmu lokalu mieszkalnego, rolę najemcy i kwoty", async () => {
      const output = await executeClassification({
        fullText: sampleLeaseContract,
        fileName: "umowa.txt",
      });

      expect(output.contractType).toBe("najem_lokalu_mieszkalnego");
      expect(output.userRole).toBe("najemca");
      expect(output.partyStatus).toBe("consumer");
      expect(output.detectedFinancials?.rentAmount).toBe(3000);
      expect(output.detectedFinancials?.depositAmount).toBe(45000);
    });

    it("respektuje odpowiedzi udzielone przez użytkownika", async () => {
      const output = await executeClassification({
        fullText: sampleLeaseContract,
        userProvidedAnswers: {
          userRole: "wynajmujacy",
          partyStatus: "business",
        },
      });

      expect(output.userRole).toBe("wynajmujacy");
      expect(output.partyStatus).toBe("business");
      expect(output.needsUserClarification).toBe(false);
    });
  });

  describe("Etap 3: Segmentacja", () => {
    it("dzieli umowę na jednostki redakcyjne (§), wyodrębnia tytuły i odwołania", async () => {
      const ingest = await executeIngest({
        analysisId: "test-seg",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });

      const seg = await executeSegmentation(ingest);

      expect(seg.totalClausesCount).toBeGreaterThanOrEqual(5);
      const clauseNumbers = seg.clauses.map((c) => c.clauseNumber);
      expect(clauseNumbers.some((n) => n.includes("§ 1"))).toBe(true);
      expect(clauseNumbers.some((n) => n.includes("§ 2"))).toBe(true);
      expect(clauseNumbers.some((n) => n.includes("§ 3"))).toBe(true);
      expect(clauseNumbers.some((n) => n.includes("§ 4"))).toBe(true);
      expect(clauseNumbers.some((n) => n.includes("§ 5"))).toBe(true);
    });
  });

  describe("Etap 4: Checklista", () => {
    it("mapuje klauzule umowy do punktów kontrolnych oraz wykrywa brakujące postanowienia", async () => {
      const ingest = await executeIngest({
        analysisId: "test-check",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });
      const seg = await executeSegmentation(ingest);
      const checklist = await executeChecklistMapping("najem_lokalu_mieszkalnego", seg, registry);

      expect(checklist.totalItemsChecked).toBeGreaterThan(15);
      const depositMatch = checklist.matches.find((m) => m.checklistItemId.includes("kaucj"));
      expect(depositMatch).toBeDefined();
      expect(depositMatch?.matchedClauseIds.length).toBeGreaterThan(0);

      // Brak protokołu zdawczo-odbiorczego w treści umowy powinien zostać odnotowany
      const inspectionMatch = checklist.matches.find((m) => m.checklistItemId.includes("protokol"));
      if (inspectionMatch) {
        expect(inspectionMatch.isMissing).toBe(true);
      }
    });
  });

  describe("Etap 5 & 6: Retrieval i Ocena", () => {
    it("precyzyjnie wykrywa przekroczenie ustawowego limitu kaucji (art. 6 UoPL) oraz karę umowną", async () => {
      const ingest = await executeIngest({
        analysisId: "test-eval",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });
      const classification = await executeClassification({ fullText: sampleLeaseContract });
      const seg = await executeSegmentation(ingest);
      const checklist = await executeChecklistMapping("najem_lokalu_mieszkalnego", seg, registry);
      const retrieval = await executeRetrieval(checklist, seg, "2026-03-01", kb, registry);
      const evaluation = await executeEvaluation(classification, seg, checklist, retrieval, registry);

      expect(evaluation.totalEvaluated).toBeGreaterThan(0);

      // Audyt kaucji: czynsz 3000 zł -> limit 12x = 36000 zł. Kaucja w umowie to 45000 zł -> nadwyżka 9000 zł
      const depositEval = evaluation.evaluations.find((e) => e.tytulPoLudzku.includes("Kaucja przekracza"));
      expect(depositEval).toBeDefined();
      expect(depositEval?.ocena).toBe("czerwony");
      expect(depositEval?.kwotaRyzyka).toBe(9000);
      expect(depositEval?.zrodlaIds).toContain("uopl-art-6");

      // Audyt kary umownej za wypowiedzenie
      const penaltyEval = evaluation.evaluations.find((e) => e.tytulPoLudzku.includes("kara umowna za rozwiązanie"));
      expect(penaltyEval).toBeDefined();
      expect(penaltyEval?.ocena).toBe("czerwony");
      expect(penaltyEval?.zrodlaIds).toContain("kc-art-385-3");
    });
  });

  describe("Etap 7: Walidacja dwuwarstwowa", () => {
    it("weryfikuje dosłowność cytatu i istnienie źródeł, odrzuca zmyślone źródła prawne", async () => {
      const ingest = await executeIngest({
        analysisId: "test-val",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });
      const classification = await executeClassification({ fullText: sampleLeaseContract });
      const seg = await executeSegmentation(ingest);
      const checklist = await executeChecklistMapping("najem_lokalu_mieszkalnego", seg, registry);
      const retrieval = await executeRetrieval(checklist, seg, "2026-03-01", kb, registry);
      const evaluation = await executeEvaluation(classification, seg, checklist, retrieval, registry);

      const validation = await executeValidation(
        evaluation,
        sampleLeaseContract,
        "2026-03-01",
        kb,
        new DeterministicGeminiVerifier(kb)
      );

      expect(validation.isGroundingClean).toBe(true);
      expect(validation.verifiedFindings.length).toBeGreaterThan(0);
      for (const finding of validation.verifiedFindings) {
        expect(finding.cytatZweryfikowany).toBe(true);
        expect(finding.zweryfikowaneZrodlaIds.length).toBeGreaterThan(0);
        expect(finding.geminiVerifierVerdict).toBe("popiera");
      }
    });

    it("bezwzględnie odrzuca uwagę opartą na zmyślonym źródle (anty-halucynacja)", async () => {
      const fakeEvaluation = {
        evaluations: [
          {
            clauseId: "clause-fake",
            checklistItemId: "uniwersalna-kary",
            ocena: "czerwony" as const,
            tytulPoLudzku: "Zmyślony artykuł prawny",
            doslownyCytatZUmowy: "kara umowna w kwocie 5000 zł",
            uzasadnienie: "Wymyślony przepis",
            zrodlaIds: ["wmyslony-art-999-z-kosmosu"],
            pewnosc: 0.9,
          },
        ],
        totalEvaluated: 1,
        rawModelName: "gemini-1.5-pro-002",
        evaluatedAt: new Date().toISOString(),
      };

      const validation = await executeValidation(
        fakeEvaluation,
        sampleLeaseContract,
        "2026-03-01",
        kb
      );

      expect(validation.isGroundingClean).toBe(false);
      expect(validation.rejectedCount).toBe(1);
      expect(validation.verifiedFindings).toHaveLength(0);
    });
  });

  describe("Etap 8: Benchmark rynkowy (reguła N >= 50)", () => {
    it("poprawnie klasyfikuje kaucję 15x jako skrajną przy dużej próbie N=1420", async () => {
      const classification = await executeClassification({ fullText: sampleLeaseContract });
      const ingest = await executeIngest({
        analysisId: "test-bm",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });
      const seg = await executeSegmentation(ingest);

      const benchmark = await executeBenchmark(classification, seg);

      const depositBm = benchmark.comparisons.find((c) => c.paramKey === "kaucja_wielokrotnosc_czynszu");
      expect(depositBm).toBeDefined();
      expect(depositBm?.sampleSize).toBe(1420);
      expect(depositBm?.hasSufficientSample).toBe(true);
      expect(depositBm?.classification).toBe("skrajny");
    });

    it("ustawia 'brak_danych' i wyłącza etykietę rynkową gdy N < 50", async () => {
      const classification = await executeClassification({ fullText: sampleLeaseContract });
      const ingest = await executeIngest({
        analysisId: "test-bm-small",
        fileName: "umowa.txt",
        mimeType: "text/plain",
        rawTextContent: sampleLeaseContract,
      });
      const seg = await executeSegmentation(ingest);

      const benchmark = await executeBenchmark(classification, seg, [
        {
          paramKey: "specjalistyczna_oplata_niszowa",
          label: "Opłata niszowa",
          contractValue: 500,
          marketMedianValue: 200,
          sampleSize: 15, // N < 50
          hasSufficientSample: false,
          classification: "skrajny",
          explanation: "Nieistotny tekst",
        },
      ]);

      const smallSampleBm = benchmark.comparisons.find((c) => c.paramKey === "specjalistyczna_oplata_niszowa");
      expect(smallSampleBm).toBeDefined();
      expect(smallSampleBm?.hasSufficientSample).toBe(false);
      expect(smallSampleBm?.classification).toBe("brak_danych");
      expect(smallSampleBm?.explanation).toContain("Zbyt mała próba statystyczna");
    });
  });

  describe("Etap 9: Agregacja raportu i deterministyczny werdykt", () => {
    it("generuje deterministyczny werdykt 'PODPISZ PO ZMIANACH' i sumuje kwoty ryzyka", async () => {
      const orchestrator = new PipelineOrchestrator(kb, registry);
      const result = await orchestrator.runFastVerdict({
        contractText: sampleLeaseContract,
      });

      expect(result.report.verdictOneSentence).toContain("PODPISZ PO ZMIANACH");
      expect(result.report.recommendedAction).toBe("popros_o_zmiany");
      expect(result.report.counts.red).toBe(2);
      expect(result.report.totalRiskAmount).toBe(14000);
      expect(result.report.totalRiskAssumptions).toBeDefined();

      // Zgodność ze schematem Zod
      const parseResult = AggregatedReportSchema.safeParse(result.report);
      expect(parseResult.success).toBe(true);

      // Widok darmowy (reguła 01)
      expect(result.freeTier.topRisks.length).toBeLessThanOrEqual(3);
      expect(result.freeTier.topRisks.length).toBe(2);
      expect(result.freeTier.verdictOneSentence).toBe(result.report.verdictOneSentence);
      expect(result.executionTimeMs).toBeLessThan(5000); // daleka bezpieczna rezerwa wobec progu 60s
    });

    it("generuje deterministyczny werdykt 'NIE PODPISUJ BEZ PRAWNIKA' dla umowy skrajnie niebezpiecznej", async () => {
      const predatoryContract = `
UMOWA NAJMU LOKALU MIESZKALNEGO

Jan Kowalski, Wynajmujący i Piotr Nowak, Najemca.
§ 1. Czynsz wynosi 2000 zł miesięcznie.
§ 2. Kaucja wynosi 80000 zł (słownie: osiemdziesiąt tysięcy złotych).
§ 3. Za każde opóźnienie w płatności czynszu Najemca zapłaci karę umowną 10000 zł.
§ 4. Wynajmujący może w każdej chwili jednostronnie zmienić umowę bez zgody Najemcy.
§ 5. Najemca zrzeka się wszelkich praw do sądu powszechnego i poddaje się arbitrażowi.
§ 6. Wypowiedzenie umowy przez Najemcę skutkuje natychmiastowym przepadkiem kaucji i karą 20000 zł.
`.trim();

      const orchestrator = new PipelineOrchestrator(kb, registry);
      const result = await orchestrator.runFastVerdict({
        contractText: predatoryContract,
      });

      expect(result.report.verdictOneSentence).toContain("NIE PODPISUJ BEZ PRAWNIKA");
      expect(result.report.recommendedAction).toBe("skonsultuj_z_prawnikiem");
      expect(result.report.totalRiskAmount).toBeGreaterThanOrEqual(50000);
    });
  });

  describe("Etap 10: Generowanie poprawek i maila negocjacyjnego", () => {
    it("generuje poprawki (soft/firm) oraz gotowy szablon maila z linkiem mailto", async () => {
      const orchestrator = new PipelineOrchestrator(kb, registry);
      const fullResult = await orchestrator.runFullPipeline({
        contractText: sampleLeaseContract,
      });

      const gen = fullResult.generation;
      expect(gen.amendments.length).toBeGreaterThan(0);

      const depositAmendment = gen.amendments.find((a) => a.legalRationale.includes("art. 6"));
      expect(depositAmendment).toBeDefined();
      expect(depositAmendment?.softReplacementText).toContain("1-miesięcznemu czynszowi");
      expect(depositAmendment?.firmReplacementText).toContain("art. 6 ust. 1");

      const email = gen.negotiationEmail;
      expect(email.subject).toContain("najem");
      expect(email.bodySoft).toContain("Dzień dobry");
      expect(email.bodyFirm).toContain("naruszają bezwzględnie obowiązujące normy");
      expect(email.bulletPointsList.length).toBeGreaterThan(0);
      expect(email.mailtoUrl).toContain("mailto:?subject=");

      // Zgodność ze schematem Zod
      const parseResult = GenerationOutputSchema.safeParse(gen);
      expect(parseResult.success).toBe(true);
    });
  });

  describe("Czysta umowa (scenariusz PODPISZ)", () => {
    it("zwraca werdykt 'PODPISZ' dla bezpiecznej umowy bez klauzul abuzywnych", async () => {
      const cleanContract = `
UMOWA NAJMU LOKALU MIESZKALNEGO

Zawarta w Warszawie pomiędzy:
Janem Kowalskim, PESEL: 85010112345, zwanym "Wynajmującym",
a
Piotrem Nowakiem, PESEL: 92020254321, zwanym "Najemcą".

§ 1. Wynajmujący oddaje Najemcy lokal mieszkalny nr 5 przy ul. Marszałkowskiej 10 w Warszawie na cele mieszkaniowe.
§ 2. Czynsz wynosi 2500 zł miesięcznie.
§ 3. Kaucja zabezpieczająca wynosi 2500 zł i zostanie zwrócona w terminie 14 dni od zwrotu lokalu.
§ 4. Umowa zawarta na czas oznaczony 1 roku. Każda ze stron może wypowiedzieć umowę z zachowaniem miesięcznego okresu wypowiedzenia z ważnych przyczyn.
§ 5. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.
§ 6. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego i ustawy o ochronie praw lokatorów.
`.trim();

      const orchestrator = new PipelineOrchestrator(kb, registry);
      const result = await orchestrator.runFastVerdict({
        contractText: cleanContract,
      });

      expect(result.report.counts.red).toBe(0);
      expect(result.freeTier.verdictOneSentence).toContain("PODPISZ");
      expect(result.report.recommendedAction).toBe("mozesz_podpisac");
    });
  });
});
