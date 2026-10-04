import React from "react";
import {
  Bot,
  Scale,
  DatabaseZap,
  CheckCircle2,
  XCircle,
  FileSearch,
  EyeOff,
  Sparkles,
  BookOpen,
  Award,
  ShieldCheck,
  Landmark,
  Globe2,
} from "lucide-react";

export function TrustAndStandards() {
  return (
    <section id="jak-dziala" className="border-t border-slate-800 bg-[#071322] py-16 text-slate-200 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Nagłówek sekcji */}
        <div className="max-w-3xl text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Standard inżynierii prawnej i zaufania
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Dlaczego czypodpisac.pl chroni Cię 10x skuteczniej niż ogólny czat AI?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Gdy w grę wchodzą Twoje pieniądze, odpowiedzialność finansowa czy utrata dachu nad głową, nie możesz
            polegać na domysłach i halucynacjach ogólnej sztucznej inteligencji. Nasz silnik opiera się na twardych
            źródłach prawa, niezależnej weryfikacji i gwarancji prywatności.
          </p>
        </div>

        {/* Porównanie z Czatami AI: czypodpisac.pl vs Zwykły Czat */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Kolumna 1: Zwykły czat AI */}
          <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-6 sm:p-8 text-left">
            <div className="flex items-center gap-3 text-red-400">
              <Bot className="h-6 w-6" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white">Zwykły czat AI (ChatGPT, Claude, Copilot)</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Halucynuje i zmyśla przepisy:</strong> Potrafi z pełnym przekonaniem
                  zacytować nieistniejący artykuł ustawy, wymyślić sygnaturę wyroku lub powołać się na prawo obce.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Nie zna aktualnego stanu prawnego:</strong> Odpowiada na podstawie
                  losowych danych z internetu sprzed miesięcy lub lat, nie wiedząc o świeżych nowelizacjach prawa.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Płaskie porady bez wyceny ryzyka:</strong> Ogranicza się do ogólników w stylu
                  „warto to skonsultować”, nie potrafiąc wyliczyć ryzyka w złotówkach ani przygotować gotowych poprawek.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Wykorzystuje Twoje umowy do trenowania:</strong> Wklejane poufne dane,
                  zarobki i tajemnice handlowe mogą zasilić przyszłe bazy szkoleniowe modeli.
                </span>
              </li>
            </ul>
          </div>

          {/* Kolumna 2: czypodpisac.pl */}
          <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0e2a4a] to-[#091a31] p-6 sm:p-8 text-left shadow-xl shadow-cyan-950/30">
            <div className="flex items-center gap-3 text-cyan-300">
              <Scale className="h-6 w-6" aria-hidden="true" />
              <h3 className="text-xl font-bold text-white">Dedykowany silnik czypodpisac.pl</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Kardynalna reguła ZAKAZU ZMYŚLANIA:</strong> Żadna uwaga w raporcie nie
                  może powstać bez bezpośredniego cytatu z Twojej umowy oraz oficjalnego źródła prawa z datą obowiązywania.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Dwuetapowa weryfikacja krzyżowa:</strong> Wynik analizy przechodzi przez
                  dwa niezależne etapy: deterministyczne reguły prawne w kodzie oraz osobny moduł weryfikujący cytaty co do litery.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Twarda wycena ryzyka i gotowe maile:</strong> Otrzymujesz wyliczenie
                  potencjalnego kosztu kar (np. 50 000 zł), gotowe nowe brzmienie zapisów i gotowe maile do drugiej strony.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  <strong className="text-white">Gwarancja poufności w UE:</strong> Zero trenowania sztucznej inteligencji
                  na Twoich umowach. Dokumenty są analizowane w bezpiecznej pamięci RAM i natychmiast usuwane.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4 OFICJALNE FILARY PRAWA, Z KTÓRYMI SILNIK MA ŁĄCZNOŚĆ */}
        <div className="mt-20 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-3">
            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
            Źródła wiedzy prawnej
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Z jakimi oficjalnymi źródłami prawa ma bezpośrednią łączność czypodpisac.pl?
          </h3>
          <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
            Nasz system nie opiera się wyłącznie na tekstach ustaw Sejmu. Analiza integruje cztery komplementarne filary
            polskiego i europejskiego porządku prawnego z weryfikacją sum kontrolnych SHA-256:
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filar 1: Sejm ELI / ISAP */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-blue-400/40 transition-colors">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-4">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Filar 1 • Ustawodawstwo RP
              </span>
              <h4 className="text-base font-bold text-white">Akty prawne Sejmu (ELI / ISAP)</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Ujednolicone teksty Dzienników Ustaw: Kodeks cywilny, Kodeks pracy, ustawa o prawach konsumenta,
                ustawa deweloperska, prawo autorskie oraz ustawa o ochronie praw lokatorów.
              </p>
            </div>

            {/* Filar 2: Rejestr UOKiK */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-400/40 transition-colors">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-4">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Filar 2 • Ochrona konsumenta
              </span>
              <h4 className="text-base font-bold text-white">Rejestr Klauzul UOKiK</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Baza ponad 8 500 klauzul niedozwolonych (abuzywnych), orzeczenia Sądu Ochrony Konkurencji i Konsumentów
                (SOKiK) oraz oficjalne decyzje Prezesa UOKiK zakazujące nieuczciwych zapisów.
              </p>
            </div>

            {/* Filar 3: Orzecznictwo Sądu Najwyższego */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-400/40 transition-colors">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
                <Scale className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Filar 3 • Linia orzecznicza
              </span>
              <h4 className="text-base font-bold text-white">Baza orzecznictwa SN i sądów</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Uchwały i wyroki Izby Pracy oraz Izby Cywilnej Sądu Najwyższego (m.in. w sprawach pozornych zleceń z cechami
                etatu z art. 22 k.p. oraz miarkowania wygórowanych kar umownych z art. 484 § 2 k.c.).
              </p>
            </div>

            {/* Filar 4: Prawo Unii Europejskiej */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-400/40 transition-colors">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 mb-4">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Filar 4 • Standardy unijne
              </span>
              <h4 className="text-base font-bold text-white">Prawo UE (EUR-Lex i TSUE)</h4>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Dyrektywa Rady 93/13/EWG w sprawie nieuczciwych warunków w umowach konsumenckich, standardy dyrektywy
                Omnibus oraz wiążące orzeczenia Trybunału Sprawiedliwości Unii Europejskiej.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Wyróżniki dla Użytkownika */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <DatabaseZap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Podwójna weryfikacja w kodzie</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Żadna uwaga nie trafi do Twojego raportu, jeśli nie przejdzie podwójnego testu: zgodności z bazą reguł oraz
              niezależnego audytora weryfikującego dosłowność cytatu.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400">
              <FileSearch className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Wyjaśnienia dla laika</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Bez niezrozumiałego prawniczego bełkotu. Wyjaśniamy czarno na białym: co oznacza dany zapis w codziennym
              życiu, ile pieniędzy możesz stracić i jakich zmian zażądać przed podpisaniem.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <EyeOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-white">Poufność i standardy bankowe</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Przetwarzanie wyłącznie w UE, szyfrowanie TLS 1.3, brak trenowania modeli na umowach oraz certyfikowane
              płatności BLIK obsługiwane przez operatora Przelewy24 (PayPro S.A.).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
