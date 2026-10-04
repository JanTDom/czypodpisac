"use client";

import React, { useState } from "react";
import { StartHero, ContractSubmission } from "../components/start-hero";
import { AnalysisProgress } from "../components/analysis-progress";
import { ReportView } from "../components/report-view";
import { ContextQuestionsModal } from "../components/context-questions";
import { DemoSampleReport } from "../components/demo-sample-report";
import { TrustAndStandards } from "../components/trust-and-standards";
import { ContextQuestion } from "../pipeline/schemas/stage02-classification";
import { AggregatedReport } from "../pipeline/schemas/stage09-aggregation";
import { GenerationOutput } from "../pipeline/schemas/stage10-generation";
import { RotateCcw } from "lucide-react";

type FlowState = "start" | "extracting" | "clarification" | "analyzing" | "report";

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

    // Jeśli przesłano plik lub zdjęcia — wywołaj /api/extract
    if (!textToAnalyze && (submission.file || (submission.files && submission.files.length > 0))) {
      setFlowState("extracting");
      try {
        const formData = new FormData();
        if (submission.file) {
          formData.append("file", submission.file);
        }
        if (submission.files) {
          for (const f of submission.files) {
            formData.append("files", f);
          }
        }

        const extractRes = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!extractRes.ok) {
          const errData = await extractRes.json().catch(() => ({}));
          throw new Error(
            errData.error ||
              "Nie udało się odczytać dokumentu. Wklej treść umowy jako tekst lub upewnij się, że plik nie jest uszkodzony."
          );
        }

        const extractData = await extractRes.json();
        textToAnalyze = extractData.text;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Błąd podczas odczytu pliku.";
        setErrorMessage(msg);
        setFlowState("start");
        return;
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 40) {
      setErrorMessage("Dokument nie zawiera wystarczającej ilości tekstu do przeprowadzenia analizy.");
      setFlowState("start");
      return;
    }

    setContractText(textToAnalyze);
    setFlowState("analyzing");

    try {
      const userRole = submission.userRole === "auto" ? undefined : submission.userRole;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: textToAnalyze,
          fileName: submission.fileName,
          isPaid: false,
          userProvidedAnswers: userRole ? { userRole } : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Wystąpił błąd podczas analizy umowy.");
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nie udało się przeanalizować dokumentu.";
      setErrorMessage(msg);
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
            userRole: answers["q-user-role"] || currentSubmission?.userRole,
            partyStatus: answers["q-party-status"],
          },
        }),
      });

      const data = await res.json();
      setReport(data.report);
      setGeneration(data.generation);
      setFlowState("report");
    } catch {
      setErrorMessage("Wystąpił błąd po zapisie odpowiedzi.");
      setFlowState("report");
    }
  };

  // 3. Odblokowanie płatnej wersji pełnej
  const handleUnlockPaid = async () => {
    // Płatności P24 są obsługiwane przez dedykowany modal płatności
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
        <div className="mx-auto mt-4 max-w-xl rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-semibold text-red-200 text-left">
          {errorMessage}
        </div>
      )}

      {flowState === "start" && (
        <>
          <StartHero onSubmit={handleContractSubmit} />
          <TrustAndStandards />
          <DemoSampleReport />
        </>
      )}

      {flowState === "extracting" && (
        <div className="py-20 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0d213c] p-8 text-white shadow-xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <h3 className="mt-6 text-lg font-bold">Odczytujemy Twój dokument...</h3>
            <p className="mt-2 text-xs text-slate-300">
              Wyciągamy tekst ze stron dokumentu w bezpiecznej pamięci operacyjnej serwera.
            </p>
          </div>
        </div>
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
            <span className="text-xs text-slate-400 font-mono">
              Dokument: <strong className="text-white">{currentSubmission?.fileName}</strong>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 shadow-sm"
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
