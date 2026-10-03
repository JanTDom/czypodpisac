import * as crypto from "node:crypto";
import { LegalKnowledgeBase } from "../kb";
import { ChecklistRegistry } from "../checklists/registry";
import { executeIngest } from "./stages/stage01-ingest";
import { executeClassification } from "./stages/stage02-classification";
import { executeSegmentation } from "./stages/stage03-segmentation";
import { executeChecklistMapping } from "./stages/stage04-checklist";
import { executeRetrieval } from "./stages/stage05-retrieval";
import { executeEvaluation } from "./stages/stage06-evaluation";
import { executeValidation, GeminiVerifierClient, DeterministicGeminiVerifier } from "./stages/stage07-validation";
import { executeBenchmark } from "./stages/stage08-benchmark";
import { executeAggregation } from "./stages/stage09-aggregation";
import { executeGeneration } from "./stages/stage10-generation";

import {
  ClassificationOutput,
  ContextQuestion,
} from "./schemas/stage02-classification";
import { ValidatedFinding } from "./schemas/stage07-validation";
import { AggregatedReport, NextActionRecommendation } from "./schemas/stage09-aggregation";
import { GenerationOutput } from "./schemas/stage10-generation";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "text/plain";

export interface PipelineInput {
  analysisId?: string;
  contractText?: string;
  fileBuffer?: Uint8Array | Buffer;
  fileName?: string;
  mimeType?: SupportedMimeType;
  contractDate?: string;
  userProvidedAnswers?: {
    userRole?: string;
    partyStatus?: string;
  };
}

export interface FreeTierSummary {
  verdictOneSentence: string;
  topRisks: ValidatedFinding[];
  remainingIssuesCount: number;
  recommendedAction: NextActionRecommendation;
  totalRiskAmount?: number;
  totalRiskAssumptions?: string;
  clarificationQuestions: ContextQuestion[];
  needsClarification: boolean;
}

export interface FastVerdictResult {
  analysisId: string;
  executionTimeMs: number;
  freeTier: FreeTierSummary;
  classification: ClassificationOutput;
  report: AggregatedReport;
}

export interface FullPipelineResult extends FastVerdictResult {
  generation: GenerationOutput;
}

/**
 * PipelineOrchestrator — Centralny koordynator 10-etapowej analizy umów czypodpisac.pl.
 *
 * Spełnia kluczowe wymagania z AGENTS.md i silnik-analizy:
 * 1. Zapewnia szybki darmowy wynik (werdykt + 3 ryzyka + liczba pozostałych) w < 60 s.
 * 2. Pełny raport i generowanie poprawek/maila wykonuje w tle lub na żądanie.
 * 3. Zapewnia bezpieczną degradację i stuprocentową weryfikowalność źródeł prawnych.
 */
export class PipelineOrchestrator {
  private kb: LegalKnowledgeBase;
  private registry: ChecklistRegistry;
  private verifier: GeminiVerifierClient;

  constructor(
    kb: LegalKnowledgeBase = LegalKnowledgeBase.getInstance(),
    registry: ChecklistRegistry = ChecklistRegistry.getInstance(),
    verifier?: GeminiVerifierClient
  ) {
    this.kb = kb;
    this.registry = registry;
    this.verifier = verifier || new DeterministicGeminiVerifier(kb);
  }

  /**
   * Szybki werdykt (< 60 sekund) — etapy 1 do 9.
   */
  public async runFastVerdict(input: PipelineInput): Promise<FastVerdictResult> {
    const startTime = Date.now();
    const analysisId = input.analysisId || crypto.randomUUID();
    const contractDate = input.contractDate || new Date().toISOString().slice(0, 10);

    // Etap 1: Ingest
    const ingestOutput = await executeIngest({
      analysisId,
      fileName: input.fileName || "umowa.txt",
      fileSizeBytes: input.fileBuffer?.byteLength || (input.contractText ? Buffer.byteLength(input.contractText, "utf8") : 0),
      mimeType: input.mimeType || "text/plain",
      fileBuffer: input.fileBuffer ? Buffer.from(input.fileBuffer) : undefined,
      rawTextContent: input.contractText,
    });

    // Etap 2: Klasyfikacja
    const classificationOutput = await executeClassification({
      fullText: ingestOutput.fullText,
      fileName: ingestOutput.fileName,
      userProvidedAnswers: input.userProvidedAnswers,
    });

    // Etap 3: Segmentacja
    const segmentationOutput = await executeSegmentation(ingestOutput);

    // Etap 4: Checklista (Uniwersalna + Dedykowana)
    const checklistOutput = await executeChecklistMapping(
      classificationOutput.contractType,
      segmentationOutput,
      this.registry
    );

    // Etap 5: Retrieval źródeł z legal-kb/
    const retrievalOutput = await executeRetrieval(
      checklistOutput,
      segmentationOutput,
      contractDate,
      this.kb,
      this.registry
    );

    // Etap 6: Ocena klauzul
    const evaluationOutput = await executeEvaluation(
      classificationOutput,
      segmentationOutput,
      checklistOutput,
      retrievalOutput,
      this.registry
    );

    // Etap 7: Walidacja dwuwarstwowa (kod + weryfikator)
    const validationOutput = await executeValidation(
      evaluationOutput,
      ingestOutput.fullText,
      contractDate,
      this.kb,
      this.verifier
    );

    // Etap 8: Benchmark rynkowy (N >= 50)
    const benchmarkOutput = await executeBenchmark(
      classificationOutput,
      segmentationOutput
    );

    // Etap 9: Agregacja raportu i deterministyczny werdykt
    const aggregatedReport = await executeAggregation(
      analysisId,
      classificationOutput,
      checklistOutput,
      validationOutput,
      benchmarkOutput,
      this.registry
    );

    // Wyciągnięcie widoku darmowego (reguła 01: werdykt + 3 najważniejsze ryzyka + liczba pozostałych)
    const allRisks = [...aggregatedReport.findings.red, ...aggregatedReport.findings.yellow];
    const topRisks = allRisks.slice(0, 3);
    const totalIssuesCount =
      aggregatedReport.counts.red +
      aggregatedReport.counts.yellow +
      aggregatedReport.counts.missing;
    const remainingIssuesCount = Math.max(0, totalIssuesCount - topRisks.length);

    const freeTier: FreeTierSummary = {
      verdictOneSentence: aggregatedReport.verdictOneSentence,
      topRisks,
      remainingIssuesCount,
      recommendedAction: aggregatedReport.recommendedAction,
      totalRiskAmount: aggregatedReport.totalRiskAmount,
      totalRiskAssumptions: aggregatedReport.totalRiskAssumptions,
      clarificationQuestions: classificationOutput.clarificationQuestions,
      needsClarification: classificationOutput.needsUserClarification,
    };

    const executionTimeMs = Date.now() - startTime;

    return {
      analysisId,
      executionTimeMs,
      freeTier,
      classification: classificationOutput,
      report: aggregatedReport,
    };
  }

  /**
   * Pełny pipeline analizy (etapy 1 do 10) wraz z generowaniem poprawek i maila negocjacyjnego.
   */
  public async runFullPipeline(input: PipelineInput): Promise<FullPipelineResult> {
    const fastResult = await this.runFastVerdict(input);

    // Re-segmentacja lub odtworzenie struktury do generowania poprawek
    const ingestOutput = await executeIngest({
      analysisId: fastResult.analysisId,
      fileName: input.fileName || "umowa.txt",
      fileSizeBytes: input.fileBuffer?.byteLength || (input.contractText ? Buffer.byteLength(input.contractText, "utf8") : 0),
      mimeType: input.mimeType || "text/plain",
      fileBuffer: input.fileBuffer ? Buffer.from(input.fileBuffer) : undefined,
      rawTextContent: input.contractText,
    });
    const segmentationOutput = await executeSegmentation(ingestOutput);

    // Etap 10: Generowanie poprawek i maila negocjacyjnego
    const generationOutput = await executeGeneration(
      fastResult.report,
      segmentationOutput
    );

    return {
      ...fastResult,
      generation: generationOutput,
    };
  }
}
