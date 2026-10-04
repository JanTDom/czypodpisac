"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Lock,
  ExternalLink,
  MessageSquareX,
  FileText,
  DollarSign,
  TrendingDown,
  Info,
  Check,
  Scale,
  Lightbulb,
} from "lucide-react";
import { AggregatedReport } from "../pipeline/schemas/stage09-aggregation";
import { ValidatedFinding } from "../pipeline/schemas/stage07-validation";
import { GenerationOutput } from "../pipeline/schemas/stage10-generation";
import { AmendmentsAndEmailView } from "./amendments-and-email";
import { PaywallModal } from "./paywall-modal";

interface ReportViewProps {
  report: AggregatedReport;
  rawContractText?: string;
  generation?: GenerationOutput;
  isPaid?: boolean;
  onUnlockPaid?: () => void;
  onDisputeFinding?: (findingId: string, reason: string) => Promise<void>;
}

export function ReportView({
  report,
  rawContractText = "",
  generation,
  isPaid = false,
  onUnlockPaid,
  onDisputeFinding,
}: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<"findings" | "amendments">("findings");
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isGreenOpen, setIsGreenOpen] = useState(false);
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set());
  const [disputeInputId, setDisputeInputId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  // Podział na darmowe 3 ryzyka lub pełną listę
  const allRed = report.findings.red;
  const allYellow = report.findings.yellow;
  const allMissing = report.findings.missing;
  const allGreen = report.findings.green;

  const totalIssuesCount = report.counts.red + report.counts.yellow + report.counts.missing;
  const displayedRed = isPaid ? allRed : allRed.slice(0, 3);
  const remainingRedCount = Math.max(0, allRed.length - displayedRed.length);
  const displayedYellow = isPaid ? allYellow : allYellow.slice(0, Math.max(0, 3 - displayedRed.length));
  const remainingCount = Math.max(0, totalIssuesCount - 3);

  // Werdykt stylizowany (ikona + kolor + etykieta)
  const isVerdictGreen = report.verdictOneSentence.startsWith("PODPISZ:");
  const isVerdictRed = report.verdictOneSentence.startsWith("NIE PODPISUJ");
  const isVerdictYellow = !isVerdictGreen && !isVerdictRed;

  const handleDisputeSubmit = async (findingId: string) => {
    if (!disputeReason.trim()) return;
    if (onDisputeFinding) {
      await onDisputeFinding(findingId, disputeReason);
    }
    setDisputedIds((prev) => new Set(prev).add(findingId));
    setDisputeInputId(null);
    setDisputeReason("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 text-left">
      {/* 1. GŁÓWNY BANER WERDYKTU */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 shadow-sm transition-all ${
          isVerdictGreen
            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
            : isVerdictRed
            ? "border-red-200 bg-red-50/80 text-red-950"
            : "border-amber-200 bg-amber-50/80 text-amber-950"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            {isVerdictGreen ? (
              <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : isVerdictRed ? (
              <AlertOctagon className="h-8 w-8 text-red-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0" aria-hidden="true" />
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                Werdykt analizy czypodpisac.pl
              </span>
              <h1 className="text-2xl font-black sm:text-3xl tracking-tight">
                {report.verdictOneSentence}
              </h1>
            </div>
          </div>

          {/* Liczniki uwag */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {report.counts.red > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                {report.counts.red} czerwone
              </span>
            )}
            {report.counts.yellow > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                {report.counts.yellow} żółte
              </span>
            )}
            {report.counts.missing > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                {report.counts.missing} braki
              </span>
            )}
          </div>
        </div>

        {/* Co zrobić teraz */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 opacity-70" />
            <span>
              {report.recommendedAction === "mozesz_podpisac" &&
                "Rekomendacja: Możesz bezpiecznie podpisać umowę. Zapisy są standardowe i zrównoważone."}
              {report.recommendedAction === "popros_o_zmiany" &&
                "Rekomendacja: Nie podpisuj w obecnym brzmieniu. Poproś drugą stronę o zmianę wskazanych zapisów."}
              {report.recommendedAction === "skonsultuj_z_prawnikiem" &&
                "Rekomendacja: Ryzyko jest zbyt wysokie. Skonsultuj umowę z prawnikiem przed złożeniem podpisu."}
            </span>
          </div>

          {report.recommendedAction === "skonsultuj_z_prawnikiem" && (
            <a
              href="mailto:kontakt@czypodpisac.pl?subject=Konsultacja%20prawna%20do%20umowy"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 shadow"
            >
              Konsultacja z prawnikiem 1-kliknięciem
            </a>
          )}
        </div>
      </div>

      {/* 2. PODSUMOWANIE KWOT I BENCHMARK RYNKOWY */}
      {(report.totalRiskAmount || report.benchmarks.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {report.totalRiskAmount && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Zidentyfikowane ryzyko finansowe
              </span>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {report.totalRiskAmount.toLocaleString("pl-PL")} zł
              </p>
              {report.totalRiskAssumptions && (
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Założenia: {report.totalRiskAssumptions}
                </p>
              )}
            </div>
          )}

          {report.benchmarks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                Porównanie z rynkiem (N={report.benchmarks[0].sampleSize})
              </span>
              <div className="mt-2 space-y-2">
                {report.benchmarks.map((bm) => (
                  <div key={bm.paramKey} className="text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{bm.label}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          bm.classification === "standard_rynkowy"
                            ? "bg-emerald-100 text-emerald-800"
                            : bm.classification === "skrajny"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bm.classification.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{bm.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ZAKŁADKI: UWAGI VS POPRAWKI I MAIL */}
      <div className="mt-8 border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("findings")}
            className={`shrink-0 whitespace-nowrap pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "findings"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Lista uwag i ryzyk ({totalIssuesCount})
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPaid) {
                setIsPaywallOpen(true);
              } else {
                setActiveTab("amendments");
              }
            }}
            className={`shrink-0 whitespace-nowrap pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "amendments"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {!isPaid && <Lock className="h-3.5 w-3.5 text-slate-400" />}
            Gotowe poprawki i mail negocjacyjny
          </button>
        </nav>
      </div>

      {activeTab === "amendments" && generation && isPaid ? (
        <div className="mt-8">
          <AmendmentsAndEmailView generation={generation} />
        </div>
      ) : (
        /* WIDOK LISTY UWAG I PODGLĄDU UMOWY */
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEWA KOLUMNA DESKTOP: TEKST UMOWY Z PODŚWIETLENIAMI */}
          <div className="hidden lg:block lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sticky top-20 max-h-[82vh] overflow-y-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Podgląd treści umowy
            </span>
            <div className="font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap select-text">
              {rawContractText}
            </div>
          </div>

          {/* PRAWA KOLUMNA: KARTY UWAG */}
          <div className="lg:col-span-7 space-y-6">
            {/* Sekcja czerwona */}
            {displayedRed.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-700 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  Najważniejsze ryzyka (czerwone flagi)
                </h2>

                {displayedRed.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    isActive={activeFindingId === finding.id}
                    onSelect={() => setActiveFindingId(finding.id)}
                    isDisputed={disputedIds.has(finding.id)}
                    onOpenDispute={() => setDisputeInputId(finding.id)}
                  />
                ))}
              </div>
            )}

            {/* Bramka paywalla dla wersji darmowej (reguła 01) */}
            {!isPaid && remainingCount > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 p-6 sm:p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white mb-3">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Wykryto jeszcze {remainingCount} {remainingCount === 1 ? "uwagę" : "uwag"} do tej umowy
                </h2>
                <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
                  Darmowy wynik obejmuje 3 kluczowe ryzyka. Odblokuj pełny raport, gotowe nowe brzmienie złych zapisów, szkic maila do drugiej strony i eksporty.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPaywallOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-800 transition"
                >
                  Odblokuj pełny raport (39 zł BLIK)
                </button>
              </div>
            )}

            {/* Sekcja żółta */}
            {(isPaid ? allYellow : displayedYellow).length > 0 && (
              <div className="space-y-4 pt-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zapisy niekorzystne (żółte uwagi)
                </h2>

                {(isPaid ? allYellow : displayedYellow).map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    isActive={activeFindingId === finding.id}
                    onSelect={() => setActiveFindingId(finding.id)}
                    isDisputed={disputedIds.has(finding.id)}
                    onOpenDispute={() => setDisputeInputId(finding.id)}
                  />
                ))}
              </div>
            )}

            {/* Sekcja braki w umowie */}
            {allMissing.length > 0 && isPaid && (
              <div className="space-y-4 pt-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  Czego w umowie nie ma, a powinno być (braki)
                </h2>

                {allMissing.map((missing) => (
                  <div
                    key={missing.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{missing.title}</h4>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Brak zapisu
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{missing.whyImportant}</p>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-800 font-mono">
                      <span className="block text-[10px] font-bold text-blue-700 uppercase mb-1">
                        Zalecana klauzula do uzupełnienia:
                      </span>
                      {missing.recommendedClauseText}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sekcja zielone (domyślnie zwinięte) */}
            {allGreen.length > 0 && isPaid && (
              <div className="border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => setIsGreenOpen(!isGreenOpen)}
                  className="flex w-full items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Zapisy standardowe i bezpieczne ({allGreen.length})
                  </span>
                  {isGreenOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isGreenOpen && (
                  <div className="mt-4 space-y-3">
                    {allGreen.map((greenFinding) => (
                      <div
                        key={greenFinding.id}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3.5 text-xs text-slate-700"
                      >
                        <p className="font-semibold text-emerald-950">{greenFinding.tytulPoLudzku}</p>
                        <p className="mt-1 text-[11px] text-slate-500 font-mono">
                          &quot;{greenFinding.doslownyCytatZUmowy}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal płatności BLIK */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onSuccess={() => {
          if (onUnlockPaid) onUnlockPaid();
          setActiveTab("amendments");
        }}
        totalFindingsCount={totalIssuesCount}
      />

      {/* Modal zgłoszenia uwagi (Nie zgadzam się) */}
      {disputeInputId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="dispute-dialog-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 id="dispute-dialog-title" className="text-base font-bold text-slate-900">Nie zgadzasz się z tą uwagą?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Twoja opinia trafi bezpośrednio do prawnika weryfikującego działanie silnika czypodpisac.pl.
            </p>
            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Napisz krótko, dlaczego ta uwaga jest według Ciebie nieprawidłowa lub nie ma zastosowania..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisputeInputId(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => handleDisputeSubmit(disputeInputId)}
                className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
              >
                Wyślij opinię
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FindingCard({
  finding,
  isActive,
  onSelect,
  isDisputed,
  onOpenDispute,
}: {
  finding: ValidatedFinding;
  isActive: boolean;
  onSelect: () => void;
  isDisputed: boolean;
  onOpenDispute: () => void;
}) {
  const isRed = finding.ocena === "czerwony";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-2xl border p-5 transition-all cursor-pointer ${
        isActive
          ? "border-blue-600 ring-2 ring-blue-600/20 bg-white shadow-md"
          : isRed
          ? "border-red-200 bg-white hover:border-red-300 hover:shadow-xs"
          : "border-amber-200 bg-white hover:border-amber-300 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isRed ? (
            <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900">{finding.tytulPoLudzku}</h3>
            {finding.kwotaRyzyka && (
              <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                Koszt ryzyka: {finding.kwotaRyzyka.toLocaleString("pl-PL")} zł
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDispute();
          }}
          disabled={isDisputed}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 shrink-0"
        >
          {isDisputed ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              Zgłoszono
            </>
          ) : (
            <>
              <MessageSquareX className="h-3 w-3" />
              Nie zgadzam się
            </>
          )}
        </button>
      </div>

      {/* Cytat z umowy */}
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700 font-mono">
        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
          Cytat z Twojej umowy:
        </span>
        &quot;{finding.doslownyCytatZUmowy}&quot;
      </div>

      {/* Ustrukturyzowane wyjaśnienie i wskazówki */}
      <div className="mt-4">
        <StructuredExplanation
          rawText={finding.uzasadnienie}
          recommendation={finding.propozycjaZmianyKierunek}
        />
      </div>

      {/* Podstawa prawna z linkiem i stanem prawnym */}
      {finding.zweryfikowaneZrodlaIds.length > 0 && (() => {
        const sourceInfo = getLegalSourceInfo(finding.zweryfikowaneZrodlaIds);
        return (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Podstawa prawna:</span>
            <span className="font-mono font-medium text-slate-800">{finding.zweryfikowaneZrodlaIds.join(", ")}</span>
            <span className="text-slate-400">•</span>
            <a
              href={sourceInfo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
            >
              {sourceInfo.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      })()}
    </div>
  );
}

function getLegalSourceInfo(sourceIds: string[]) {
  const idsCombined = sourceIds.join(" ").toLowerCase();
  if (idsCombined.includes("uokik")) {
    return {
      label: "Rejestr klauzul UOKiK",
      href: "https://decyzje.uokik.gov.pl/bp/kndz.nsf",
    };
  }
  if (idsCombined.includes("sn-") || idsCombined.includes("orzecznictwo")) {
    return {
      label: "Orzecznictwo Sądu Najwyższego",
      href: "https://www.sn.pl/orzecznictwo",
    };
  }
  if (idsCombined.includes("ue") || idsCombined.includes("eur-") || idsCombined.includes("93/13")) {
    return {
      label: "Prawo UE (EUR-Lex)",
      href: "https://eur-lex.europa.eu",
    };
  }
  return {
    label: "Oficjalny tekst Sejmu (ELI/ISAP)",
    href: "https://isap.sejm.gov.pl",
  };
}

function StructuredExplanation({
  rawText,
  recommendation,
}: {
  rawText: string;
  recommendation?: string;
}) {
  let mainPart = rawText.trim();
  let evidencePart = "";
  let actionText = recommendation?.trim() || "";

  // 1. Wyciągnięcie sekcji dowodów / sygnałów
  const evidenceSplitIndex = mainPart.search(/(?:Dowody wykryte|Sygnały wykryte)[^\n]*:/i);
  if (evidenceSplitIndex !== -1) {
    evidencePart = mainPart.slice(evidenceSplitIndex).trim();
    mainPart = mainPart.slice(0, evidenceSplitIndex).trim();
  }

  // 2. Wyciągnięcie rekomendacji / działania z tekstu (jeśli nie przekazano w propsie)
  if (!actionText) {
    const actionMatch = mainPart.match(/(?:Rekomendowane działanie|Rekomendacja|Co zrobić|Jak to zmienić):\s*([\s\S]+)$/i);
    if (actionMatch && actionMatch.index !== undefined) {
      actionText = actionMatch[1].trim();
      mainPart = mainPart.slice(0, actionMatch.index).trim();
    }
  }

  // 3. Wyciągnięcie sekcji prawnej ("Co mówi prawo:")
  let lawText = "";
  const lawMatch = mainPart.match(/(?:Co mówi (?:polskie )?prawo|Podstawa prawna|Z punktu widzenia prawa):\s*([\s\S]+)$/i);
  if (lawMatch && lawMatch.index !== undefined) {
    lawText = lawMatch[1].trim();
    mainPart = mainPart.slice(0, lawMatch.index).trim();
  } else {
    // Sprawdź czy po podziale na akapity któryś zaczyna się od odwołania do przepisów
    const paragraphs = mainPart.split(/\n\s*\n/);
    if (paragraphs.length >= 2) {
      const legalParaIndex = paragraphs.findIndex((p) =>
        /^(?:Zgodnie z|Art\.\s*\d+|Na mocy|W polskim prawie|Przepisy|Zastrzeżenie kary umownej w oderwaniu)/i.test(p.trim())
      );
      if (legalParaIndex > 0) {
        lawText = paragraphs.slice(legalParaIndex).join("\n\n").trim();
        mainPart = paragraphs.slice(0, legalParaIndex).join("\n\n").trim();
      }
    }
  }

  // 4. Oczyszczenie wstępu dla laika z prefiksów technicznych
  let intro = mainPart
    .replace(/^(?:Dla laika|W praktyce|Podsumowanie dla Ciebie|Co to oznacza):\s*/i, "")
    .trim();

  // 5. Parsowanie punktów dowodowych
  const items: Array<{ title: string; quote?: string }> = [];

  if (evidencePart) {
    const cleanEvidence = evidencePart.replace(/^(?:Dowody|Sygnały)[^\n]*:\s*/i, "").trim();
    const rawItems = cleanEvidence.split(/(?:^|\n)\s*[•\-]\s*/).filter(Boolean);

    for (const rawItem of rawItems) {
      const trimmed = rawItem.trim();
      if (!trimmed) continue;

      const quoteMatch = trimmed.match(/[„"]([\s\S]+?)[”"]/);
      if (quoteMatch) {
        const title = trimmed.slice(0, quoteMatch.index).replace(/:\s*$/, "").trim();
        const quote = quoteMatch[1].trim();
        items.push({ title: title || "Fragment z umowy", quote });
      } else {
        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
        items.push({
          title: lines[0] || trimmed,
          quote: lines.slice(1).join(" "),
        });
      }
    }
  } else if (intro.includes("•")) {
    const parts = intro.split(/(?:^|\n)\s*[•\-]\s*/).filter(Boolean);
    if (parts.length > 1) {
      intro = parts[0].trim();
      for (const p of parts.slice(1)) {
        const trimmed = p.trim();
        const quoteMatch = trimmed.match(/[„"]([\s\S]+?)[”"]/);
        if (quoteMatch) {
          items.push({
            title: trimmed.slice(0, quoteMatch.index).replace(/:\s*$/, "").trim(),
            quote: quoteMatch[1].trim(),
          });
        } else {
          items.push({ title: trimmed });
        }
      }
    }
  }

  return (
    <div className="space-y-3 text-left">
      {/* 1. Wyjaśnienie po ludzku */}
      {intro && (
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider text-slate-500">
            Co to oznacza dla Ciebie w praktyce:
          </span>
          <p className="whitespace-pre-line">{intro}</p>
        </div>
      )}

      {/* 2. Co mówi prawo (wyróżniony elegancki boks z ikoną wagi) */}
      {lawText && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
          <Scale className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-800 mb-0.5">
              Co mówi polskie prawo:
            </span>
            <p className="whitespace-pre-line text-blue-900">{lawText}</p>
          </div>
        </div>
      )}

      {/* 3. Wykryte dowody i zapisy (karty punkt po punkcie zamiast zbitej ściany tekstu) */}
      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Wykryte dowody w Twojej umowie ({items.length}):
          </span>
          <div className="grid grid-cols-1 gap-2">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-xs text-slate-800"
              >
                <div className="flex items-start gap-2 font-semibold text-slate-900">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700">
                    {idx + 1}
                  </span>
                  <span>{it.title}</span>
                </div>
                {it.quote && (
                  <div className="mt-2 rounded-lg border border-slate-200/80 bg-white p-2.5 font-mono text-[11px] text-slate-700 leading-relaxed italic">
                    &quot;{it.quote}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Rekomendowane działanie / jak to naprawić */}
      {actionText && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
          <Lightbulb className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 mb-0.5">
              Rekomendowane działanie:
            </span>
            <p className="whitespace-pre-line text-emerald-900">{actionText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
