"use client";

import React, { useState } from "react";
import { StartHero, ContractSubmission } from "../components/start-hero";
import { AnalysisProgress } from "../components/analysis-progress";
import { ReportView } from "../components/report-view";
import { ContextQuestionsModal } from "../components/context-questions";
import { DemoSampleReport } from "../components/demo-sample-report";
import { ContextQuestion } from "../pipeline/schemas/stage02-classification";
import { AggregatedReport } from "../pipeline/schemas/stage09-aggregation";
import { GenerationOutput } from "../pipeline/schemas/stage10-generation";
import { RotateCcw } from "lucide-react";

type FlowState = "start" | "clarification" | "analyzing" | "report";

export default function HomePage() {
  const [flowState, setFlowState] = useState<FlowState>("start");
  const [currentSubmission, setCurrentSubmission] = useState<ContractSubmission | null>(null);
  const [contractText, setContractText] = useState<string>("");
  const [clarificationQuestions, setClarificationQuestions] = useState<ContextQuestion[]>([]);
  const [report, setReport] = useState<AggregatedReport | null>(null);
  const [generation, setGeneration] = useState<GenerationOutput | undefined>(undefined);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Złożenie dokumentu (plik, tekst lub aparat)
  const handleContractSubmit = async (submission: ContractSubmission) => {
    setCurrentSubmission(submission);
    setErrorMessage(null);

    let textToAnalyze = submission.text || "";

    if (submission.file && !submission.text) {
      const isPlainText =
        submission.file.type === "text/plain" || submission.file.name.toLowerCase().endsWith(".txt");
      if (!isPlainText) {
        setErrorMessage(
          "Na razie czytamy tylko tekst. Otwórz umowę, skopiuj jej treść i wklej ją w pole tekstowe."
        );
        return;
      }
      textToAnalyze = await submission.file.text();
    }

    setContractText(textToAnalyze);
    setFlowState("analyzing");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: textToAnalyze,
          fileName: submission.fileName,
          isPaid: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Wystąpił błąd podczas analizy.");
      }

      const data = await res.json();

      // Jeśli wymagane pytania doprecyzowujące (maksymalnie 2)
      if (data.freeTier?.needsClarification && data.freeTier?.clarificationQuestions?.length > 0) {
        setClarificationQuestions(data.freeTier.clarificationQuestions);
        setReport(data.report);
        setFlowState("clarification");
        return;
      }

      setReport(data.report);
      setFlowState("report");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Nie udało się przeanalizować dokumentu.");
      setFlowState("start");
    }
  };

  // 2. Odpowiedź na pytania kontekstowe
  const handleClarificationAnswer = async (answers: Record<string, string>) => {
    setFlowState("analyzing");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          fileName: currentSubmission?.fileName || "umowa.txt",
          userProvidedAnswers: {
            userRole: answers["q-user-role"],
            partyStatus: answers["q-party-status"],
          },
        }),
      });

      const data = await res.json();
      setReport(data.report);
      setGeneration(data.generation);
      setFlowState("report");
    } catch (err: any) {
      setErrorMessage("Wystąpił błąd po zapisie odpowiedzi.");
      setFlowState("report");
    }
  };

  // 3. Odblokowanie płatnej wersji pełnej (BLIK)
  const handleUnlockPaid = async () => {
    // B7: płatny raport wydaje tylko serwer po potwierdzonej płatności.
    // Bramka płatności nie jest jeszcze podłączona, więc nic tu nie odblokowujemy.
    setErrorMessage("Płatny raport nie jest jeszcze dostępny.");
  };

  const handleDisputeFinding = async (findingId: string, reason: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        findingId,
        reason,
        contractType: report?.contractType,
      }),
    });
  };

  const handleReset = () => {
    setFlowState("start");
    setCurrentSubmission(null);
    setContractText("");
    setReport(null);
    setGeneration(undefined);
    setIsPaid(false);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col">
      {errorMessage && (
        <div className="mx-auto mt-4 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 text-left">
          {errorMessage}
        </div>
      )}

      {flowState === "start" && (
        <>
          <StartHero onSubmit={handleContractSubmit} />
          <DemoSampleReport />
        </>
      )}

      {flowState === "clarification" && (
        <ContextQuestionsModal
          questions={clarificationQuestions}
          onAnswer={handleClarificationAnswer}
        />
      )}

      {flowState === "analyzing" && (
        <div className="py-16">
          <AnalysisProgress />
        </div>
      )}

      {flowState === "report" && report && (
        <div>
          <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 flex justify-between items-center no-print">
            <span className="text-xs text-slate-500 font-mono">
              Dokument: <strong className="text-slate-800">{currentSubmission?.fileName}</strong>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Sprawdź inną umowę
            </button>
          </div>

          <ReportView
            report={report}
            rawContractText={contractText}
            generation={generation}
            isPaid={isPaid}
            onUnlockPaid={handleUnlockPaid}
            onDisputeFinding={handleDisputeFinding}
          />
        </div>
      )}
    </div>
  );
}
