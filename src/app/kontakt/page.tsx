import React from "react";
import Link from "next/link";
import { Mail, MapPin, Building, ShieldCheck, ArrowLeft, PhoneCall, CreditCard, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt i informacje o płatnościach – czypodpisac.pl",
  description:
    "Dane kontaktowe firmy Multinewsroom, obsługa reklamacji oraz informacje o operatorze płatności Przelewy24 (PayPro S.A.) w czypodpisac.pl.",
};

export default function KontaktPage() {
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

        <div className="space-y-8 text-left">
          {/* Karta danych firmy */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
            <header className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Biuro obsługi i dane rejestrowe
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kontakt i dane Usługodawcy
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                W sprawach merytorycznych, technicznych oraz reklamacji jesteśmy do Twojej dyspozycji.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Building className="h-4 w-4 text-blue-700" />
                  Dane rejestrowe firmy
                </div>
                <dl className="text-xs space-y-1.5 text-slate-700">
                  <div><strong className="text-slate-900">Firma:</strong> Multinewsroom Jan Domaniewski</div>
                  <div><strong className="text-slate-900">Siedziba:</strong> ul. Barcicka 44, 01-839 Warszawa</div>
                  <div><strong className="text-slate-900">NIP:</strong> 525-218-92-41</div>
                  <div><strong className="text-slate-900">REGON:</strong> 147154574</div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Mail className="h-4 w-4 text-blue-700" />
                  Obsługa zgłoszeń i reklamacji
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    Wiadomości e-mail:{" "}
                    <a href="mailto:kontakt@czypodpisac.pl" className="font-semibold text-blue-700 hover:underline">
                      kontakt@czypodpisac.pl
                    </a>
                  </p>
                  <p className="text-slate-500">
                    Na zapytania i zgłoszenia reklamacyjne odpowiadamy w dni robocze, zwykle w ciągu 24 godzin.
                  </p>
                  <p className="text-slate-500">
                    Procedura reklamacji opisana jest w §6 Regulaminu Serwisu.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Dedykowana karta Przelewy24 / PayPro S.A. */}
          <article className="rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-6 sm:p-10 shadow-xs space-y-6">
            <header className="border-b border-blue-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                Certyfikowany operator płatności
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Płatności internetowe Przelewy24 (PayPro S.A.)
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Wszystkie transakcje online w serwisie czypodpisac.pl są autoryzowane i zabezpieczane przez licencjonowanego
                operatora krajowego pod nadzorem Komisji Nadzoru Finansowego (KNF).
              </p>
            </header>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                <strong>Operator płatności:</strong> PayPro Spółka Akcyjna z siedzibą w Poznaniu przy ul. Pastelowej 8 (60-198 Poznań),
                wpisana do rejestru przedsiębiorców Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy Poznań – Nowe Miasto
                i Wilda w Poznaniu, VIII Wydział Gospodarczy KRS pod numerem KRS <strong>0000347935</strong>, NIP:{" "}
                <strong>779-236-98-87</strong>, REGON: <strong>301345068</strong>, kapitał zakładowy: 5 476 300,00 zł wpłacony
                w całości, wpisana do rejestru krajowych instytucji płatniczych prowadzonego przez Komisję Nadzoru Finansowego
                (KNF) pod numerem <strong>UKNF IP24/2014</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                  <CreditCard className="h-4 w-4 text-blue-700" />
                  Dostępne formy płatności
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li><strong>BLIK:</strong> szybki kod z bankowości mobilnej</li>
                  <li><strong>Szybki przelew (Pay-by-link):</strong> automatyczne przekierowanie do banku</li>
                  <li><strong>Karty płatnicze:</strong> Visa, Mastercard z 3D-Secure</li>
                  <li><strong>Portfele cyfrowe:</strong> Apple Pay, Google Pay</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                  <Lock className="h-4 w-4 text-emerald-700" />
                  Zasady rozliczeń i zwrotów
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li><strong>Ceny brutto PLN z VAT:</strong> brak ukrytych opłat</li>
                  <li><strong>Brak subskrypcji:</strong> jednorazowa opłata 29 zł</li>
                  <li><strong>Natychmiastowy dostęp:</strong> odblokowanie w sekundę</li>
                  <li><strong>Zwrot środków:</strong> do 14 dni tą samą metodą przez Przelewy24</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-blue-100 pt-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-3">
              <span>Wsparcie techniczne operatora: <a href="mailto:serwis@przelewy24.pl" className="text-blue-700 underline">serwis@przelewy24.pl</a></span>
              <span>Infolinia Przelewy24: +48 61 642 93 44</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
