import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności i ochrona danych – czypodpisac.pl",
  description:
    "Zasady przetwarzania danych osobowych (RODO), poufność dokumentów, brak trenowania modeli AI na umowach użytkowników oraz polityka cookies w czypodpisac.pl.",
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Nawigacja powrotu */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do strony głównej
          </Link>
        </div>

        {/* Karta dokumentu */}
        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-8 text-left leading-relaxed">
          <header className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">
              <Shield className="h-3.5 w-3.5" />
              Prywatność i RODO
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Polityka prywatności i poufności dokumentów
            </h1>
            <p className="mt-2 text-xs text-slate-500">
              Zgodna z Ogólnym Rozporządzeniem o Ochronie Danych (RODO / GDPR) • Aktualizacja: 4 października 2026 r.
            </p>
          </header>

          {/* Żelazna zasada poufności */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900 uppercase tracking-wider">
              <Lock className="h-4 w-4 text-emerald-700" />
              Kluczowa gwarancja poufności czypodpisac.pl:
            </div>
            <p className="leading-relaxed">
              <strong>Nigdy nie trenujemy modeli sztucznej inteligencji na Twoich umowach ani danych osobowych.</strong>{" "}
              Przesłane dokumenty przetwarzane są wyłącznie w pamięci operacyjnej w bezpiecznej chmurze w Unii Europejskiej
              na potrzeby wygenerowania Twojego raportu. Po zakończeniu analizy i wygaśnięciu sesji dane dokumentu są trwale usuwane.
            </p>
          </div>

          {/* 1. Administrator */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              1. Administrator danych osobowych
            </h2>
            <p className="text-xs text-slate-700">
              Administratorem danych osobowych Użytkowników serwisu internetowego <strong>czypodpisac.pl</strong> jest:
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-mono text-slate-800 space-y-1">
              <p><strong>Multinewsroom Jan Domaniewski</strong></p>
              <p>Adres siedziby: ul. Barcicka 44, 01-839 Warszawa</p>
              <p>NIP: 525-218-92-41 • REGON: 147154574</p>
              <p>E-mail: <a href="mailto:kontakt@czypodpisac.pl" className="text-blue-700 hover:underline">kontakt@czypodpisac.pl</a></p>
            </div>
          </section>

          {/* 2. Zakres i cele */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              2. Kategorie danych, cele i podstawy prawne przetwarzania
            </h2>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <strong className="text-slate-900 block">A. Treść analizowanych umów:</strong>
                Przetwarzana wyłącznie w celu wykonania usługi analizy prawnej umowy (art. 6 ust. 1 lit. b RODO). Tekst
                przetwarzany jest w pamięci operacyjnej i nie jest wykorzystywany do celów marketingowych ani trenowania modeli.
              </div>
              <div>
                <strong className="text-slate-900 block">B. Adres e-mail (w przypadku zamówienia płatnego raportu):</strong>
                Wykorzystywany do przesłania potwierdzenia transakcji, kopii raportu oraz obsługi ewentualnych reklamacji
                (art. 6 ust. 1 lit. b i c RODO).
              </div>
              <div>
                <strong className="text-slate-900 block">C. Dane rozliczeniowe transakcji:</strong>
                Przetwarzane w celu wypełnienia obowiązków prawno-podatkowych i rachunkowych (art. 6 ust. 1 lit. c RODO).
              </div>
            </div>
          </section>

          {/* 3. Odbiorcy danych */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              3. Odbiorcy danych i podmioty współpracujące
            </h2>
            <p className="text-xs text-slate-700">
              Dane osobowe mogą być powierzane do przetwarzania wyłącznie zaufanym podmiotom, niezbędnym do świadczenia usług:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
              <li>
                <strong>PayPro S.A. (Przelewy24)</strong> z siedzibą w Poznaniu (ul. Pastelowa 8, 60-198 Poznań) – operator
                płatności elektronicznych obsługujący płatności BLIK, kartami i przelewami online jako niezależny administrator
                danych transakcyjnych;
              </li>
              <li>
                <strong>Dostawcy infrastruktury chmurowej w UE (Vercel Inc. / GCP Frankfurt):</strong> zabezpieczeni
                klauzulami RODO, zapewniający bezstanowe (stateless) przetwarzanie żądań;
              </li>
              <li>
                Organy państwowe uprawnione na podstawie przepisów prawa (np. organy podatkowe).
              </li>
            </ul>
          </section>

          {/* 4. Retencja danych */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              4. Okres przechowywania danych
            </h2>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
              <li>
                <strong>Treść umów i plików:</strong> przechowywane wyłącznie tymczasowo w pamięci podręcznej na czas trwania
                sesji Użytkownika. Usuwane automatycznie z serwerów.
              </li>
              <li>
                <strong>Dane transakcyjne i księgowe:</strong> przechowywane przez okres 5 lat, licząc od końca roku
                kalendarzowego, w którym upłynął termin płatności podatku (zgodnie z przepisami prawa podatkowego).
              </li>
              <li>
                <strong>Korespondencja reklamacyjna:</strong> do 3 lat w celach obrony przed roszczeniami prawnymi.
              </li>
            </ul>
          </section>

          {/* 5. Prawa użytkownika */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              5. Prawa przysługujące Użytkownikowi (RODO)
            </h2>
            <p className="text-xs text-slate-700">
              Każdej osobie przysługuje prawo dostępu do swoich danych, sprostowania, usunięcia („prawo do bycia zapomnianym”),
              ograniczenia przetwarzania, wniesienia sprzeciwu oraz wniesienia skargi do organu nadzorczego:{" "}
              <strong>Prezesa Urzędu Ochrony Danych Osobowych (UODO)</strong>, ul. Stawki 2, 00-193 Warszawa.
            </p>
          </section>

          {/* 6. Pliki cookies */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              6. Pliki cookies i pamięć lokalna (localStorage)
            </h2>
            <p className="text-xs text-slate-700">
              Serwis korzysta z technologii pamięci przeglądarki (localStorage / sessionStorage) wyłącznie w celu zachowania
              stanu wygenerowanego raportu na Twoim urządzeniu. Serwis <strong>nie stosuje inwazyjnych trackerów reklamowych
              ani śledzących ciasteczek osób trzecich</strong>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
