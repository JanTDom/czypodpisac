import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PipelineOrchestrator } from "../src/pipeline/orchestrator";
import { executeIngest } from "../src/pipeline/stages/stage01-ingest";
import { executeSegmentation } from "../src/pipeline/stages/stage03-segmentation";
import { ValidatedFinding } from "../src/pipeline/schemas/stage07-validation";
import { geminiConfig } from "../src/config/models";

/**
 * Ewaluacja trafności prawnej (skill ewaluacja-jakosci-prawnej).
 * Uruchamia silnik na zbiorze test-contracts/, liczy metryki, zapisuje raport w docs/eval/
 * i sprawdza progi wydania. Czerwony wynik = nie wydawać.
 */

type Category = "kaucja_limit" | "kara_wypowiedzenie" | "jednostronna_zmiana" | "inne";
type Verdict = "PODPISZ" | "PODPISZ PO ZMIANACH" | "NIE PODPISUJ BEZ PRAWNIKA";

interface EvalCase {
  id: string;
  kind: string;
  text: string;
  repeatFiller?: number;
  expected: { verdict: Verdict; red: Category[]; riskAmount?: number; missingAttachments?: string[] };
}

interface EvalSet {
  contractType: string;
  version: string;
  lawyerApproved: boolean;
  cases: EvalCase[];
}

interface GroundingAudit {
  checkedAt: string;
  results: Array<{ id: string; status: string }>;
}

const SET_FILE = "test-contracts/najem-lokalu-mieszkalnego.json";
const GROUNDING_FILE = "docs/eval/kb-grounding-audit.json";
const BASELINE_FILE = "docs/eval/baseline.json";
const REPORT_JSON = "docs/eval/eval-najem-lokalu-mieszkalnego.json";
const FILLER_CLAUSE = "Strony zobowiązują się współdziałać przy wykonywaniu umowy i informować się o zmianie adresu do doręczeń.";
// Dokładność kwot: liczymy w złotych, tolerujemy zaokrąglenie do 1 grosza.
const AMOUNT_TOLERANCE = 0.01;

function categorize(finding: ValidatedFinding): Category {
  const title = finding.tytulPoLudzku.toLowerCase();
  if (title.includes("kaucja przekracza")) return "kaucja_limit";
  if (title.includes("kara umowna za rozwiązanie")) return "kara_wypowiedzenie";
  if (title.includes("jednostronna zmiana")) return "jednostronna_zmiana";
  return "inne";
}

function verdictOf(sentence: string): Verdict {
  if (sentence.startsWith("NIE PODPISUJ BEZ PRAWNIKA")) return "NIE PODPISUJ BEZ PRAWNIKA";
  if (sentence.startsWith("PODPISZ PO ZMIANACH")) return "PODPISZ PO ZMIANACH";
  return "PODPISZ";
}

function buildText(c: EvalCase): string {
  if (!c.repeatFiller) return c.text;
  const fillers = Array.from({ length: c.repeatFiller }, (_, i) => `§ ${100 + i}. ${FILLER_CLAUSE}`);
  return `${c.text}\n${fillers.join("\n")}`;
}

function gitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "nieznany";
  }
}

describe("Ewaluacja prawna: najem lokalu mieszkalnego", () => {
  it("spełnia progi wydania", async () => {
    const evalSet = JSON.parse(fs.readFileSync(SET_FILE, "utf8")) as EvalSet;
    const grounding = fs.existsSync(GROUNDING_FILE)
      ? (JSON.parse(fs.readFileSync(GROUNDING_FILE, "utf8")) as GroundingAudit)
      : null;
    const confirmedSourceIds = new Set(
      (grounding?.results ?? []).filter((r) => r.status === "potwierdzona").map((r) => r.id)
    );

    const orchestrator = new PipelineOrchestrator();
    const perCase = [];
    let expectedRed = 0;
    let detectedRed = 0;
    let falseRed = 0;
    let amountChecks = 0;
    let amountCorrect = 0;
    let expectedMissing = 0;
    let detectedMissing = 0;
    const unconfirmedSources = new Set<string>();

    for (const c of evalSet.cases) {
      const text = buildText(c);
      const result = await orchestrator.runFastVerdict({ contractText: text, analysisId: undefined });
      const redFindings = result.report.findings.red;
      const yellowFindings = result.report.findings.yellow;
      const detectedCategories = redFindings.map(categorize);

      const hits = c.expected.red.filter((cat) => detectedCategories.includes(cat));
      const extras = detectedCategories.filter((cat) => !c.expected.red.includes(cat));
      expectedRed += c.expected.red.length;
      detectedRed += hits.length;
      falseRed += extras.length;

      for (const f of [...redFindings, ...yellowFindings]) {
        for (const id of f.zweryfikowaneZrodlaIds) if (!confirmedSourceIds.has(id)) unconfirmedSources.add(id);
      }

      let amountOk: boolean | null = null;
      if (c.expected.riskAmount !== undefined) {
        amountChecks += 1;
        const actual = result.report.totalRiskAmount ?? 0;
        amountOk = Math.abs(actual - c.expected.riskAmount) <= AMOUNT_TOLERANCE;
        if (amountOk) amountCorrect += 1;
      }

      let missingAttachmentsDetected: string[] = [];
      if (c.expected.missingAttachments) {
        const ingest = await executeIngest({
          analysisId: crypto.randomUUID(),
          fileName: `${c.id}.txt`,
          fileSizeBytes: Buffer.byteLength(text, "utf8"),
          mimeType: "text/plain",
          rawTextContent: text,
        });
        const segmentation = await executeSegmentation(ingest);
        missingAttachmentsDetected = segmentation.attachments.filter((a) => !a.presentInDocument).map((a) => a.name);
        expectedMissing += c.expected.missingAttachments.length;
        detectedMissing += c.expected.missingAttachments.filter((m) => missingAttachmentsDetected.includes(m)).length;
      }

      const actualVerdict = verdictOf(result.report.verdictOneSentence);
      perCase.push({
        id: c.id,
        kind: c.kind,
        expectedVerdict: c.expected.verdict,
        actualVerdict,
        verdictOk: actualVerdict === c.expected.verdict,
        expectedRed: c.expected.red,
        detectedRed: detectedCategories,
        missedRed: c.expected.red.filter((cat) => !detectedCategories.includes(cat)),
        falseRed: extras,
        expectedRiskAmount: c.expected.riskAmount ?? null,
        actualRiskAmount: result.report.totalRiskAmount ?? null,
        amountOk,
        missingAttachmentsExpected: c.expected.missingAttachments ?? [],
        missingAttachmentsDetected,
      });
    }

    const correctContracts = perCase.filter((r) => r.expectedVerdict === "PODPISZ");
    const metrics = {
      cases: perCase.length,
      redRecall: expectedRed === 0 ? 1 : detectedRed / expectedRed,
      falseRedFindings: falseRed,
      verdictAccuracy: perCase.filter((r) => r.verdictOk).length / perCase.length,
      verdictAccuracyOnCorrectContracts:
        correctContracts.length === 0 ? 1 : correctContracts.filter((r) => r.verdictOk).length / correctContracts.length,
      amountAccuracy: amountChecks === 0 ? 1 : amountCorrect / amountChecks,
      missingAttachmentRecall: expectedMissing === 0 ? 1 : detectedMissing / expectedMissing,
      unconfirmedSourcesInFindings: [...unconfirmedSources],
    };

    const baseline = fs.existsSync(BASELINE_FILE)
      ? (JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")) as { redRecall: number })
      : null;

    const gates = {
      groundingAuditPresent: grounding !== null,
      zeroUnconfirmedSources: grounding !== null && unconfirmedSources.size === 0,
      noRedRecallDrop: baseline === null ? null : metrics.redRecall >= baseline.redRecall,
      correctVerdictOnCorrectContracts: metrics.verdictAccuracyOnCorrectContracts === 1,
      expectationsApprovedByLawyer: evalSet.lawyerApproved,
    };

    const report = {
      generatedAt: new Date().toISOString(),
      versions: {
        gitCommit: gitCommit(),
        evalSet: evalSet.version,
        groundingAuditAt: grounding?.checkedAt ?? null,
        models: {
          fast: geminiConfig.fastModel,
          flagship: geminiConfig.flagshipModel,
          verifier: geminiConfig.verifierModel,
        },
        engineNote: "Silnik w tej wersji nie wywołuje Gemini; ocena i weryfikator są regułowe (DeterministicGeminiVerifier).",
      },
      metrics,
      gates,
      perCase,
    };
    fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

    expect(gates.groundingAuditPresent).toBe(true);
    expect(metrics.unconfirmedSourcesInFindings).toEqual([]);
    expect(metrics.verdictAccuracyOnCorrectContracts).toBe(1);
    if (baseline) expect(metrics.redRecall).toBeGreaterThanOrEqual(baseline.redRecall);
  });
});
