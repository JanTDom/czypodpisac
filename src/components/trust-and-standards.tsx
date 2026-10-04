import React from "react";
import {
  ShieldAlert,
  Bot,
  Scale,
  DatabaseZap,
  CheckCircle2,
  XCircle,
  FileSearch,
  EyeOff,
  Cpu,
  Sparkles,
} from "lucide-react";

export function TrustAndStandards() {
  return (
    <section className="border-t border-slate-800 bg-[#071322] py-16 text-slate-200 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Nagłówek sekcji */}
        <div className="max-w-3xl text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Standard jakości i zaufania
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Dlaczego czypodpisac.pl chroni Cię lepiej niż zwykły czat AI?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Gdy w grę wchodzą Twoje pieniądze, odpowiedzialność finansowa czy utrata dachu nad głową, nie możesz
            polegać na domysłach sztucznej inteligencji. Zobacz, czym różni się nasz certyfikowany silnik od ChatGPT czy Claude.
          </p>
        </div>

        {/* Porównanie z Czatami AI: czypodpisac.pl vs Zwykły Czat */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Kolumna 1: Zwykły czat AI */}
          <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-6 sm:p-8 text-left">
            <div className="flex items-center gap-3 text-red-400">
              <Bot className="h-6 w-6" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white">Zwykły czat AI (ChatGPT, Claude itp.)</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Wymyśla przepisy i halucynuje:</strong> Potrafi z pełnym przekonaniem
                  zacytować nieistniejący artykuł ustawy lub powołać się na prawo amerykańskie zamiast polskiego.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Myli stan prawny:</strong> Korzysta z danych sprzed miesięcy lub lat,
                  nie wiedząc o najnowszych nowelizacjach Kodeksu pracy czy ustaw mieszkaniowych.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Mówi to, co chcesz usłyszeć:</strong> Ma tendencję do uspokajania
                  użytkownika („umowa wygląda w porządku”), przegapiając drobne zapisy o karach umownych.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Prywatność pod znakiem zapytania:</strong> Wiele modeli domyślnie
                  wykorzystuje wklejane treści do dalszego trenowania swoich algorytmów.
                </span>
              </li>
            </ul>
          </div>

          {/* Kolumna 2: czypodpisac.pl */}
          <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0e2a4a] to-[#091a31] p-6 sm:p-8 text-left shadow-xl shadow-cyan-950/30">
            <div className="flex items-center gap-3 text-cyan-300">
              <Scale className="h-6 w-6" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white">System czypodpisac.pl</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Żelazna zasada ZAKAZU ZMYŚLANIA:</strong> Żadna uwaga w raporcie nie
                  może powstać bez bezpośredniego dowodu w treści Twojej umowy oraz oficjalnego artykułu z Dziennika Ustaw.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Bezpośrednia łączność z oficjalnym prawem RP:</strong> Pobieramy teksty
                  jednolite prosto z państwowego API Sejmu RP (system ELI / ISAP) i kontrolujemy ich sumy kontrolne SHA-256.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Dwuetapowa weryfikacja krzyżowa:</strong> Zanim zobaczysz wynik, niezależny
                  moduł weryfikatora sprawdza w kodzie, czy zarzuty są uzasadnione i czy cytaty zgadzają się co do litery.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Zero śladu po umowie:</strong> Nie zapisujemy Twojej umowy na dyskach
                  ani w bazie danych. Analiza odbywa się w pamięci RAM i znika bezpowrotnie po zakończeniu sesji.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Filary Jakości */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <DatabaseZap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Połączenie z bazą Sejmu ELI</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Kodeks cywilny, Kodeks pracy, ustawa o ochronie praw lokatorów, ustawa deweloperska, prawo autorskie oraz
              rejestr klauzul niedozwolonych UOKiK. Zawsze zweryfikowany stan prawny.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400">
              <FileSearch className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Wyjaśnienia dla każdego laika</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Bez niezrozumiałego prawniczego bełkotu. Wyjaśniamy czarno na białym: co oznacza dany zapis, ile pieniędzy
              możesz stracić i jakich poprawek zażądać od drugiej strony przed podpisaniem.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <EyeOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Poufność klasy bankowej</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Przetwarzanie wyłącznie w certyfikowanym centrum danych w Unii Europejskiej. Żadna osoba trzecia ani model
              uczący się nie ma dostępu do Twoich danych i tajemnic handlowych.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
