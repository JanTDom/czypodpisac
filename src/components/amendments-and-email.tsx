"use client";

import React, { useState } from "react";
import { Copy, Check, Mail, ExternalLink, Download, FileCheck } from "lucide-react";
import { GenerationOutput } from "../pipeline/schemas/stage10-generation";

interface AmendmentsAndEmailProps {
  generation: GenerationOutput;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
}

export function AmendmentsAndEmailView({
  generation,
  onExportDocx,
  onExportPdf,
}: AmendmentsAndEmailProps) {
  const [emailTone, setEmailTone] = useState<"soft" | "firm">("soft");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);

  const emailDraft = generation.negotiationEmail;
  const currentBody = emailTone === "soft" ? emailDraft.bodySoft : emailDraft.bodyFirm;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(currentBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyClause = (findingId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseId(findingId);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  return (
    <div className="space-y-8 text-left">
      {/* 1. SEKCJA GOTOWYCH POPRAWEK DO KLAUZUL */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Projekt zmian w umowie
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Gotowe nowe brzmienie złych zapisów
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Podmień treść wskazanych paragrafów lub wklej je do uwag w trybie rejestracji zmian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportDocx}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              Pobierz DOCX (ze zmianami)
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 shadow-2xs"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Raport PDF
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {generation.amendments.map((amendment) => (
            <div
              key={amendment.findingId}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {amendment.clauseNumber}
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  {amendment.legalRationale}
                </span>
              </div>

              {/* Oryginalne brzmienie */}
              <div>
                <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1">
                  Dotychczasowe brzmienie (do wykreślenia)
                </p>
                <p className="rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-900 font-mono line-through decoration-red-600/70">
                  {amendment.originalText}
                </p>
              </div>

              {/* Wersja partnerska */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    Propozycja ugodowa (wersja uprzejma)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyClause(`${amendment.findingId}-soft`, amendment.softReplacementText)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {copiedClauseId === `${amendment.findingId}-soft` ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopiuj
                      </>
                    )}
                  </button>
                </div>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 font-mono">
                  {amendment.softReplacementText}
                </p>
              </div>

              {/* Wersja stanowcza */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                    Wersja stanowcza (z normą prawną)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyClause(`${amendment.findingId}-firm`, amendment.firmReplacementText)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900"
                  >
                    {copiedClauseId === `${amendment.findingId}-firm` ? (
                      <>
                        <Check className="h-3 w-3 text-blue-600" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopiuj
                      </>
                    )}
                  </button>
                </div>
                <p className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950 font-mono">
                  {amendment.firmReplacementText}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SEKCJA GOTOWEGO MAILA NEGOCJACYJNEGO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Komunikacja z drugą stroną
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Gotowy mail do drugiej strony
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Wybierz ton wypowiedzi i wyślij gotową wiadomość jednym kliknięciem.
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 self-start">
            <button
              type="button"
              onClick={() => setEmailTone("soft")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                emailTone === "soft"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Wersja uprzejma (prośba)
            </button>
            <button
              type="button"
              onClick={() => setEmailTone("firm")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                emailTone === "firm"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Wersja stanowcza (prawna)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 font-mono text-xs text-slate-800">
          <div className="border-b border-slate-200/80 pb-2">
            <span className="text-slate-400">Temat: </span>
            <span className="font-semibold text-slate-900">{emailDraft.subject}</span>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed py-2 font-sans text-sm">
            {currentBody}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            {copiedEmail ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Skopiowano treść maila
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Kopiuj treść maila
              </>
            )}
          </button>

          {emailDraft.mailtoUrl && (
            <a
              href={emailDraft.mailtoUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 shadow-2xs"
            >
              <Mail className="h-4 w-4" />
              Otwórz w programie pocztowym
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
