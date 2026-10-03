"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, FileText, Sparkles } from "lucide-react";

export function DemoSampleReport() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="przyklad" className="border-t border-slate-200 bg-white py-16 text-left">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Przykładowy wynik
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              Zobacz, jak wygląda raport analizy
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Przykład autentycznej analizy standardowej umowy najmu lokalu mieszkalnego z Warszawy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start"
          >
            {isExpanded ? (
              <>
                Zwiń przykład <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Rozwiń pełny przykład <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Karta przykładowego werdyktu */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-lg">
              !
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 opacity-75">
                Przykładowy werdykt
              </span>
              <h3 className="text-lg font-black text-amber-950 sm:text-xl">
                PODPISZ PO ZMIANACH: Przed podpisaniem bezwzględnie zmień zapisy (kaucja przekracza limit ustawowy oraz niedozwolona kara umowna za rozwiązanie umowy).
              </h3>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-red-600 px-3 py-1 text-white">2 ryzyka czerwone</span>
            <span className="rounded-full bg-amber-500 px-3 py-1 text-white">1 ryzyko żółte</span>
            <span className="rounded-full bg-slate-700 px-3 py-1 text-white">Łączne ryzyko: 14 000 zł</span>
          </div>
        </div>

        {/* Rozwinięcie przykładowych uwag */}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Kaucja przekracza dopuszczalny limit ustawowy
                </h4>
                <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                  Koszt nadpłaty: 9 000 zł
                </span>
                <p className="mt-2 text-xs text-slate-600">
                  <span className="font-semibold">Cytat z umowy: </span>
                  <span className="font-mono bg-slate-50 px-1 py-0.5 rounded">&quot;Najemca wpłaci kaucję w kwocie 45 000 zł&quot;</span>
                </p>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Co to dla Ciebie znaczy: </span>
                  W umowie najmu lokalu mieszkalnego kaucja nie może przekraczać 12-krotności czynszu (art. 6 ust. 1 ustawy o ochronie praw lokatorów). Przy czynszu 3 000 zł maksymalna kaucja to 36 000 zł. Standard rynkowy to 1-krotność (3 000 zł).
                </p>
              </div>
            </div>
          </div>

          {isExpanded && (
            <>
              <div className="rounded-xl border border-red-200 bg-white p-5 shadow-2xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Niedozwolona kara umowna za rozwiązanie umowy
                    </h4>
                    <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                      Nienależna kara: 5 000 zł
                    </span>
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-semibold">Cytat z umowy: </span>
                      <span className="font-mono bg-slate-50 px-1 py-0.5 rounded">&quot;W przypadku wcześniejszego wypowiedzenia umowy Wynajmujący naliczy karę 5 000 zł&quot;</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900">Co to dla Ciebie znaczy: </span>
                      Klauzula nakładająca karę umowną za skorzystanie z przysługującego prawa do rozwiązania umowy narusza art. 385³ pkt 16 k.c. i jest z mocy prawa bezskuteczna wobec konsumenta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-xs text-slate-700 animate-in fade-in">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Zapisy bezpieczne i standardowe (4)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Przedmiot umowy, forma pisemna pod rygorem nieważności, symetryczny odbiór lokalu.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
