import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin świadczenia usług – czypodpisac.pl",
  description:
    "Regulamin świadczenia usług drogą elektroniczną w serwisie czypodpisac.pl. Informacje o operatorze Przelewy24, metodach płatności, reklamacjach i odstąpieniu od umowy.",
};

export default function RegulaminPage() {
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
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
              <Scale className="h-3.5 w-3.5" />
              Dokument prawny
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Regulamin świadczenia usług drogą elektroniczną
            </h1>
            <p className="mt-2 text-xs text-slate-500">
              Obowiązuje od dnia 4 października 2026 r. • Serwis czypodpisac.pl
            </p>
          </header>

          {/* §1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §1. Postanowienia ogólne i dane Usługodawcy
            </h2>
            <p className="text-xs text-slate-700">
              1. Niniejszy Regulamin określa zasady i warunki techniczne korzystania z serwisu internetowego{" "}
              <strong>czypodpisac.pl</strong>, w tym zasady zamawiania i świadczenia odpłatnych oraz bezpłatnych usług
              cyfrowych weryfikacji ryzyka prawnego umów, prawa i obowiązki stron, procedurę reklamacyjną oraz zasady
              ochrony konsumentów.
            </p>
            <p className="text-xs text-slate-700">
              2. Właścicielem Serwisu i Usługodawcą jest:
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-mono text-slate-800 space-y-1">
              <p><strong>Firma:</strong> Multinewsroom Jan Domaniewski</p>
              <p><strong>Adres:</strong> ul. Barcicka 44, 01-839 Warszawa</p>
              <p><strong>NIP:</strong> 525-218-92-41</p>
              <p><strong>REGON:</strong> 147154574</p>
              <p><strong>E-mail:</strong> <a href="mailto:kontakt@czypodpisac.pl" className="text-blue-700 hover:underline">kontakt@czypodpisac.pl</a></p>
              <p><strong>Serwis:</strong> <a href="https://czypodpisac.pl" className="text-blue-700 hover:underline">https://czypodpisac.pl</a></p>
            </div>
            <p className="text-xs text-slate-700">
              3. Przed rozpoczęciem korzystania z Serwisu każdy Użytkownik zobowiązany jest do zapoznania się z treścią
              Regulaminu. Złożenie zamówienia na usługę płatną wymaga potwierdzenia akceptacji Regulaminu.
            </p>
          </section>

          {/* §2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §2. Przedmiot i charakter usług cyfrowych
            </h2>
            <p className="text-xs text-slate-700">
              1. Serwis czypodpisac.pl świadczy usługi cyfrowe polegające na:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
              <li>
                automatycznej analizie przesłanej treści umowy (plik PDF, DOCX, zdjęcia aparatu lub wklejony tekst) pod kątem
                postanowień niekorzystnych, pułapek prawnych, jednostronnych kar umownych, klauzul abuzywnych UOKiK oraz cech
                stosunku pracy w umowach cywilnoprawnych;
              </li>
              <li>
                wykrywaniu brakujących zapisów, które powinny chronić stronę w danym typie stosunku prawnego;
              </li>
              <li>
                szacowaniu i wyliczaniu kwot ryzyka finansowego powiązanego z postanowieniami umowy;
              </li>
              <li>
                generowaniu gotowych propozycji nowego brzmienia ryzykownych klauzul oraz gotowych szablonów maili
                negocjacyjnych (w tonie partnerskim oraz stanowczym);
              </li>
              <li>
                umożliwieniu eksportu raportu do formatu PDF oraz pliku DOCX z zarejestrowanym trybem śledzenia zmian.
              </li>
            </ul>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
              <strong>Zastrzeżenie prawne:</strong> Serwis dostarcza zaawansowane narzędzie analityczno-techniczne
              wspomagane sztuczną inteligencją i zintegrowane z oficjalnymi bazami prawa polskiego i UE. Raport ma charakter
              informacyjno-projektowy i nie stanowi indywidualnej pomocy prawnej adwokata ani radcy prawnego w rozumieniu
              ustawy o radcach prawnych lub prawa o adwokaturze.
            </div>
          </section>

          {/* §3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §3. Cennik, płatności i brak ukrytych subskrypcji
            </h2>
            <p className="text-xs text-slate-700">
              1. Wstępna analiza umowy, werdykt (PODPISZ / PODPISZ PO ZMIANACH / NIE PODPISUJ BEZ PRAWNIKA) oraz prezentacja
              najważniejszych czerwonych flag są udostępniane <strong>bezpłatnie</strong>.
            </p>
            <p className="text-xs text-slate-700">
              2. Dostęp do pełnego raportu ze wszystkimi wykrytymi uwagami, gotowymi nowymi brzmieniami klauzul, mailami
              negocjacyjnymi oraz eksportem DOCX i PDF jest usługą odpłatną.
            </p>
            <p className="text-xs text-slate-700">
              3. Cena jednorazowa za pełny raport wynosi <strong>29,00 PLN brutto</strong> (zawiera 23% podatku VAT).
            </p>
            <p className="text-xs text-slate-700">
              4. <strong>Zakup jest całkowicie jednorazowy.</strong> Serwis nie stosuje mechanizmów subskrypcyjnych, nie
              zapisuje danych kart płatniczych do automatycznych odnowień i nie pobiera żadnych ukrytych opłat.
            </p>
          </section>

          {/* §4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §4. Operator płatności Przelewy24 i realizacja transakcji
            </h2>
            <p className="text-xs text-slate-700">
              1. Operatorem płatności internetowych w serwisie czypodpisac.pl jest:
            </p>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-slate-800 leading-relaxed">
              <strong>PayPro Spółka Akcyjna</strong> z siedzibą w Poznaniu przy ul. Pastelowej 8 (60-198 Poznań), wpisana do
              rejestru przedsiębiorców Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy Poznań – Nowe Miasto i
              Wilda w Poznaniu, VIII Wydział Gospodarczy KRS pod numerem KRS <strong>0000347935</strong>, NIP:{" "}
              <strong>779-236-98-87</strong>, REGON: <strong>301345068</strong>, kapitał zakładowy: 5 476 300,00 zł wpłacony
              w całości, wpisana do rejestru krajowych instytucji płatniczych prowadzonego przez Komisję Nadzoru Finansowego
              (KNF) pod numerem <strong>UKNF IP24/2014</strong> (operator serwisu <strong>Przelewy24</strong>).
            </div>
            <p className="text-xs text-slate-700">
              2. Dostępne metody płatności:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              <li><strong>BLIK:</strong> szybka płatność kodem z aplikacji mobilnej banku;</li>
              <li><strong>Szybki przelew elektroniczny (Pay-by-link):</strong> automatyczne przekierowanie do banku;</li>
              <li><strong>Karty płatnicze:</strong> Visa, Visa Electron, Mastercard, MasterCard Electronic, Maestro z autoryzacją 3D-Secure;</li>
              <li><strong>Portfele cyfrowe:</strong> Apple Pay oraz Google Pay.</li>
            </ul>
            <p className="text-xs text-slate-700">
              3. Realizacja usługi następuje <strong>niezwłocznie po zaksięgowaniu i potwierdzeniu płatności</strong> przez
              operatora Przelewy24, poprzez automatyczne odblokowanie dostępu do pełnego raportu i pobierania plików w przeglądarce.
            </p>
          </section>

          {/* §5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §5. Prawo odstąpienia od umowy (Konsumenci)
            </h2>
            <p className="text-xs text-slate-700">
              1. Zgodnie z art. 27 ustawy z dnia 30 maja 2014 r. o prawach konsumenta, konsumentowi przysługuje co do zasady
              prawo do odstąpienia od umowy zawartej na odległość w terminie 14 dni bez podawania przyczyny.
            </p>
            <p className="text-xs text-slate-700">
              2. <strong>Utrata prawa do odstąpienia:</strong> Stosownie do art. 38 ust. 1 pkt 13 ustawy o prawach
              konsumenta, prawo odstąpienia od umowy nie przysługuje w przypadku umów o dostarczanie treści cyfrowych
              niedostarczanych na nośniku materialnym, za które konsument jest zobowiązany do zapłaty ceny, jeżeli
              Usługodawca rozpoczął świadczenie za wyraźną i uprzednią zgodą konsumenta, który został poinformowany przed
              rozpoczęciem świadczenia, że po jego spełnieniu utraci prawo odstąpienia od umowy, i przyjął to do wiadomości.
            </p>
            <p className="text-xs text-slate-700">
              3. Zgoda, o której mowa powyżej, jest wyrażana przez Użytkownika przed realizacją płatności poprzez
              zatwierdzenie zamówienia w formularzu transakcyjnym.
            </p>
          </section>

          {/* §6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §6. Procedura reklamacji i zwrotów
            </h2>
            <p className="text-xs text-slate-700">
              1. Użytkownik ma prawo złożyć reklamację dotyczącą działania Serwisu, procesu generowania raportu lub
              rozliczenia płatności.
            </p>
            <p className="text-xs text-slate-700">
              2. Reklamacje należy zgłaszać drogą elektroniczną na adres e-mail:{" "}
              <a href="mailto:kontakt@czypodpisac.pl" className="text-blue-700 font-semibold hover:underline">
                kontakt@czypodpisac.pl
              </a>.
            </p>
            <p className="text-xs text-slate-700">
              3. Zgłoszenie powinno zawierać: dane Użytkownika (adres e-mail użyty przy zamówieniu), numer lub identyfikator
              transakcji oraz zwięzły opis problemu.
            </p>
            <p className="text-xs text-slate-700">
              4. Usługodawca rozpatrzy reklamację w terminie do <strong>14 dni roboczych</strong> od dnia jej otrzymania i
              udzieli odpowiedzi na adres e-mail Użytkownika.
            </p>
            <p className="text-xs text-slate-700">
              5. W przypadku uznania reklamacji zwrot środków dokonywany jest przez Usługodawcę za pośrednictwem operatora
              płatności PayPro S.A. (Przelewy24) przy użyciu takiego samego sposobu zapłaty, jakiego użył Klient (na powiązany
              rachunek bankowy lub kartę płatniczą), w ustawowym terminie do 14 dni.
            </p>
          </section>

          {/* §7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              §7. Pozasądowe metody rozwiązywania sporów
            </h2>
            <p className="text-xs text-slate-700">
              Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń,
              w tym za pośrednictwem europejskiej platformy internetowego rozstrzygania sporów (ODR) dostępnej pod adresem:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
