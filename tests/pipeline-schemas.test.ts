import { describe, it, expect } from "vitest";
import {
  IngestOutputSchema,
  ClassificationOutputSchema,
  SegmentationOutputSchema,
  ChecklistOutputSchema,
  RetrievalOutputSchema,
  EvaluationOutputSchema,
  ValidationOutputSchema,
  BenchmarkOutputSchema,
  AggregatedReportSchema,
  GenerationOutputSchema,
  GeminiVerifierInputSchema,
  GeminiVerifierOutputSchema,
} from "../src/pipeline/schemas";
import { geminiConfig } from "../src/config/models";

describe("Weryfikacja schematów Zod dla 10 etapów pipeline'u analizy", () => {
  it("Etap 1: IngestOutputSchema poprawnie waliduje strukturę dokumentu", () => {
    const validData = {
      analysisId: "123e4567-e89b-42d3-a456-426614174000",
      fileName: "umowa_najmu_mieszkania.pdf",
      mimeType: "application/pdf",
      pageCount: 2,
      fullText: "UMOWA NAJMU LOKALU MIESZKALNEGO...",
      pages: [
        {
          pageNumber: 1,
          rawText: "Strona 1",
          blocks: [{ id: "b1", pageNumber: 1, text: "Tytuł", isHeader: true }],
          ocrApplied: false,
        },
      ],
      contentHashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processedAt: new Date().toISOString(),
    };
    expect(IngestOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 2: ClassificationOutputSchema waliduje typ umowy i maksymalnie 3 pytania kontekstowe", () => {
    const validData = {
      contractType: "najem_lokalu_mieszkalnego",
      userRole: "najemca",
      partyStatus: "consumer",
      confidence: 0.98,
      needsUserClarification: false,
      clarificationQuestions: [],
      detectedParties: [
        { role: "Wynajmujący", nameOrIdentifier: "Jan Kowalski", isIdentifiedAsConsumer: false },
        { role: "Najemca", nameOrIdentifier: "Anna Nowak", isIdentifiedAsConsumer: true },
      ],
    };
    expect(ClassificationOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 3: SegmentationOutputSchema wyodrębnia jednostki redakcyjne i załączniki", () => {
    const validData = {
      clauses: [
        {
          id: "clause-1",
          clauseNumber: "§ 1",
          title: "Przedmiot umowy",
          fullText: "Wynajmujący oddaje Najemcy do używania lokal mieszkalny...",
          pageNumber: 1,
          internalReferences: [],
          subItems: [],
        },
      ],
      attachments: [],
      definitions: {},
      totalClausesCount: 1,
    };
    expect(SegmentationOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 4: ChecklistOutputSchema mapuje punkty kontrolne i braki", () => {
    const validData = {
      contractType: "najem_lokalu_mieszkalnego",
      totalItemsChecked: 1,
      matches: [
        {
          checklistItemId: "najem-kaucja-limit",
          matchedClauseIds: ["clause-4"],
          isMissing: false,
          missingRiskSeverity: "none",
        },
      ],
      unmatchedClauseIds: [],
    };
    expect(ChecklistOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 5: RetrievalOutputSchema gromadzi jednostki prawne z legal-kb", () => {
    const validData = {
      contexts: [
        {
          clauseId: "clause-4",
          checklistItemId: "najem-kaucja-limit",
          retrievedUnits: [
            {
              id: "uopl-art-6-ust-1",
              unitType: "statute",
              actTitle: "Ustawa o ochronie praw lokatorów",
              editorialUnit: "art. 6 ust. 1",
              content: "Kaucja nie może przekraczać dwunastokrotności miesięcznego czynszu...",
              sourceUrl: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20010710733",
              legalStateDate: "2023-06-20",
              contentHashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              status: "active",
            },
          ],
        },
      ],
      allRetrievedUnitIds: ["uopl-art-6-ust-1"],
      missingRequiredSources: [],
    };
    expect(RetrievalOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 6: EvaluationOutputSchema wymusza format JSON ze źródłami i oceną", () => {
    const validData = {
      evaluations: [
        {
          clauseId: "clause-4",
          checklistItemId: "najem-kaucja-limit",
          ocena: "czerwony",
          tytulPoLudzku: "Kaucja przekracza ustawowy limit",
          doslownyCytatZUmowy: "Kaucja wynosi 50 000 zł.",
          uzasadnienie: "Żądana kaucja przekracza 12-krotność czynszu najmu, co narusza art. 6 ust. 1 ustawy.",
          zrodlaIds: ["uopl-art-6-ust-1"],
          pewnosc: 0.99,
          kwotaRyzyka: 14000,
          zalozeniaKwoty: "Przy czynszu 3000 zł maksymalna kaucja wynosi 36 000 zł. Nadwyżka to 14 000 zł.",
        },
      ],
      totalEvaluated: 1,
      evaluatedAt: new Date().toISOString(),
    };
    expect(EvaluationOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 7: ValidationOutputSchema weryfikuje istnienie źródeł i dosłowność cytatu", () => {
    const validData = {
      verifiedFindings: [
        {
          id: "987fcdeb-51a2-43d7-9876-543210987654",
          clauseId: "clause-4",
          status: "verified",
          ocena: "czerwony",
          tytulPoLudzku: "Kaucja przekracza ustawowy limit",
          doslownyCytatZUmowy: "Kaucja wynosi 50 000 zł.",
          cytatZweryfikowany: true,
          uzasadnienie: "Żądana kaucja przekracza 12-krotność czynszu najmu.",
          zweryfikowaneZrodlaIds: ["uopl-art-6-ust-1"],
          odrzuconeZrodlaIds: [],
          pewnosc: 0.99,
          geminiVerifierVerdict: "popiera",
        },
      ],
      unverifiedFindings: [],
      rejectedCount: 0,
      isGroundingClean: true,
    };
    expect(ValidationOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 7: GeminiVerifierOutputSchema i GeminiVerifierInputSchema poprawnie walidują zapytanie weryfikatora", () => {
    const input = {
      findingId: "987fcdeb-51a2-43d7-9876-543210987654",
      quoteFromContract: "Kaucja wynosi 50 000 zł.",
      thesis: "Kaucja przekracza dopuszczalny limit ustawowy",
      sources: [
        {
          sourceId: "uopl-art-6-ust-1",
          editorialUnit: "art. 6 ust. 1",
          legalText: "Kaucja nie może przekraczać dwunastokrotności miesięcznego czynszu...",
        },
      ],
    };
    expect(GeminiVerifierInputSchema.parse(input)).toBeDefined();

    const output = {
      werdykt: "popiera",
      uzasadnienie: "Przepis art. 6 ust. 1 wyraźnie ogranicza kaucję do 12-krotności czynszu.",
      popierajaceZrodlaIds: ["uopl-art-6-ust-1"],
    };
    expect(GeminiVerifierOutputSchema.parse(output)).toBeDefined();
  });

  it("Konfiguracja modeli: geminiConfig poprawnie ładuje ustawienia modeli z walidacją ról", () => {
    expect(geminiConfig.fastModel).toBeDefined();
    expect(geminiConfig.flagshipModel).toBeDefined();
    expect(geminiConfig.verifierModel).toBeDefined();
    expect(geminiConfig.embeddingModel).toBeDefined();
    expect(geminiConfig.embeddingDimensions).toBe(768);
    expect(geminiConfig.samplingParams.evaluation.temperature).toBe(0.0);
  });

  it("Etap 8: BenchmarkOutputSchema stosuje próg minimalnej próby (N >= 50)", () => {
    const validData = {
      comparisons: [
        {
          paramKey: "kaucja_wielokrotnosc_czynszu",
          label: "Wysokość kaucji",
          contractValue: 3,
          marketMedianValue: 1,
          sampleSize: 120,
          hasSufficientSample: true,
          classification: "odbiega_od_normy",
          explanation: "Rynkowy standard to 1-miesięczny czynsz; w umowie zapisano 3-krotność.",
        },
      ],
      benchmarkVersion: "2026.1",
    };
    expect(BenchmarkOutputSchema.parse(validData)).toBeDefined();
  });

  it("Etap 9: AggregatedReportSchema generuje jednozdaniowy werdykt i strukturę raportu", () => {
    const validData = {
      analysisId: "123e4567-e89b-42d3-a456-426614174000",
      contractType: "najem_lokalu_mieszkalnego",
      userRole: "najemca",
      partyStatus: "consumer",
      verdictOneSentence: "Można podpisać po zmianie §4 i wykreśleniu kary umownej.",
      counts: { red: 1, yellow: 0, missing: 0, green: 5 },
      totalRiskAmount: 14000,
      totalRiskAssumptions: "Nadpłata kaucji ponad limit ustawowy",
      recommendedAction: "negocjuj",
      findings: {
        red: [
          {
            id: "987fcdeb-51a2-43d7-9876-543210987654",
            clauseId: "clause-4",
            status: "verified",
            ocena: "czerwony",
            tytulPoLudzku: "Kaucja przekracza ustawowy limit",
            doslownyCytatZUmowy: "Kaucja wynosi 50 000 zł.",
            cytatZweryfikowany: true,
            uzasadnienie: "Żądana kaucja przekracza 12-krotność czynszu najmu.",
            zweryfikowaneZrodlaIds: ["uopl-art-6-ust-1"],
            odrzuconeZrodlaIds: [],
            pewnosc: 0.99,
          },
        ],
        yellow: [],
        missing: [],
        green: [],
      },
      benchmarks: [],
      meta: {
        aiGeneratedDisclaimer:
          "Niniejsza analiza została wygenerowana przy użyciu systemu sztucznej inteligencji czypodpisac.pl i ma charakter informacyjny. Nie stanowi pomocy prawnej w rozumieniu ustawy o radcach prawnych.",
        analyzedAt: new Date().toISOString(),
        legalKbVersion: "2026.1",
        checklistVersion: "najem-2026-v1",
      },
    };
    expect(AggregatedReportSchema.parse(validData)).toBeDefined();
  });

  it("Etap 10: GenerationOutputSchema zawiera wersję miękką i stanowczą poprawek i maila", () => {
    const validData = {
      analysisId: "123e4567-e89b-42d3-a456-426614174000",
      amendments: [
        {
          findingId: "987fcdeb-51a2-43d7-9876-543210987654",
          clauseNumber: "§ 4 ust. 1",
          originalText: "Kaucja wynosi 50 000 zł.",
          softReplacementText: "Kaucja wynosi równowartość jednomiesięcznego czynszu, tj. 3 000 zł.",
          firmReplacementText:
            "Kaucja wynosi 3 000 zł, zgodnie z art. 6 ust. 1 ustawy o ochronie praw lokatorów.",
          legalRationale: "Ustawowy limit kaucji wynosi 12-krotność miesięcznego czynszu.",
          isApprovedTemplate: true,
          needsLawyerVerification: false,
        },
      ],
      negotiationEmail: {
        recipientRole: "Wynajmujący",
        subject: "Propozycja doprecyzowania zapisów w umowie najmu",
        bodySoft: "Dzień dobry, przesyłam propozycję drobnych korekt w §4...",
        bodyFirm: "Dzień dobry, w załączeniu przesyłam uwagi prawne do §4...",
        bulletPointsList: ["Zmiana wysokości kaucji w § 4 ust. 1"],
      },
      exportCapabilities: {
        supportsDocxTrackChanges: true,
        supportsNativePrintPdf: true,
      },
      generatedAt: new Date().toISOString(),
    };
    expect(GenerationOutputSchema.parse(validData)).toBeDefined();
  });
});
