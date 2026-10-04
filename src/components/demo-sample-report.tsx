"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Scale, Lightbulb, ExternalLink } from "lucide-react";

export function DemoSampleReport() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="przyklad" className="border-t border-slate-200 bg-white py-16 text-left">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Przykładowy wynik na żywo
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              Zobacz, jak wygląda gotowy raport analizy
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Ustrukturyzowany audyt umowy testowej. Jasne podsumowanie dla laika, boks prawa, wycena ryzyka i gotowe działanie.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start shadow-2xs"
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-lg">
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
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-950">1 ryzyko żółte</span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-white">Łączne ryzyko: 14 000 zł</span>
          </div>
        </div>

        {/* Rozwinięcie przykładowych uwag - w pełnym standardzie ustrukturyzowanym */}
        <div className="mt-6 space-y-5">
          {/* Uwaga 1: Kaucja */}
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Kaucja przekracza dopuszczalny limit ustawowy
                  </h4>
                  <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    Koszt nadpłaty: 9 000 zł
                  </span>
                </div>
              </div>
            </div>

            {/* Cytat z umowy */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Cytat z Twojej umowy:
              </span>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-800">
                &quot;Najemca wpłaci kaucję zabezpieczającą w kwocie 45.000 zł&quot;
              </div>
            </div>

            {/* Ustrukturyzowane wyjaśnienie */}
            <div className="space-y-3 pt-1">
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-slate-500">
                  Co to oznacza dla Ciebie w praktyce:
                </span>
                <p>
                  Właściciel mieszkania żąda od Ciebie zamrożenia aż 45 000 zł, co stanowi 15-krotność miesięcznego czynszu.
                  W razie sporu przy wyprowadzce odzyskanie tak gigantycznej kwoty może trwać miesiącami.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
                <Scale className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-800 mb-0.5">
                    Co mówi polskie prawo:
                  </span>
                  <p className="text-blue-900">
                    Zgodnie z art. 6 ust. 1 ustawy o ochronie praw lokatorów kaucja nie może przekraczać dwunastokrotności
                    miesięcznego czynszu za dany lokal. Zapis przekraczający tę granicę jest z mocy prawa nieważny.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 mb-0.5">
                    Rekomendowane działanie:
                  </span>
                  <p className="text-emerald-900">
                    Zażądaj obniżenia kaucji do standardu rynkowego równego 1- lub maksymalnie 2-krotności czynszu
                    (np. 3 000 – 6 000 zł).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Podstawa prawna:</span>
              <span className="font-mono font-medium text-slate-800">art. 6 ust. 1 u.o.p.l.</span>
              <span className="text-slate-400">•</span>
              <a
                href="https://isap.sejm.gov.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
              >
                Oficjalny tekst Sejmu (ELI/ISAP)
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Uwaga 2: Klauzula abuzywna kary umownej (pokazywana po rozwinięciu) */}
          {isExpanded && (
            <>
              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Niedozwolona kara umowna za rozwiązanie umowy (klauzula abuzywna)
                      </h4>
                      <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                        Nienależna kara: 5 000 zł
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Cytat z Twojej umowy:
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-800">
                    &quot;W przypadku wcześniejszego wypowiedzenia umowy przez Najemcę naliczona zostanie odstępna kara umowna w kwocie 5.000 zł&quot;
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-slate-500">
                      Co to oznacza dla Ciebie w praktyce:
                    </span>
                    <p>
                      Druga strona próbuje ukarać Cię finansowo za to, że skorzystasz ze swojego ustawowego prawa do
                      wypowiedzenia umowy z ważnych przyczyn. Taki zapis jest pułapką mającą zablokować Twoje odejście.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
                    <Scale className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="leading-relaxed">
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-800 mb-0.5">
                        Co mówi polskie prawo i UOKiK:
                      </span>
                      <p className="text-blue-900">
                        Zgodnie z art. 385³ pkt 16 Kodeksu cywilnego oraz rejestrem klauzul niedozwolonych UOKiK postanowienia
                        nakładające na konsumenta obowiązek zapłaty rażąco wygórowanej kary umownej lub odstępnego za rezygnację
                        z umowy są abuzywne i bezskuteczne z mocy samego prawa.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                    <Lightbulb className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="leading-relaxed">
                      <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 mb-0.5">
                        Rekomendowane działanie:
                      </span>
                      <p className="text-emerald-900">
                        Wykreśl ten zapis w całości lub zastąp go standardowym miesięcznym okresem wypowiedzenia bez żadnych
                        kar finansowych.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Podstawa prawna:</span>
                  <span className="font-mono font-medium text-slate-800">art. 385³ pkt 16 k.c.</span>
                  <span className="text-slate-400">•</span>
                  <a
                    href="https://decyzje.uokik.gov.pl/bp/kndz.nsf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                  >
                    Rejestr klauzul UOKiK
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-xs text-slate-700 animate-in fade-in">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Zapisy bezpieczne i standardowe (4)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Prawidłowo oznaczony przedmiot umowy, forma pisemna pod rygorem nieważności, protokół zdawczo-odbiorczy.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
