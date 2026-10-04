import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "czypodpisac.pl — Czy podpisać tę umowę?",
  description:
    "Wrzuć umowę. W minutę wiesz, czy podpisać, co zmienić i jak o to poprosić. Rzetelna analiza ryzyka prawnego oparta na prawie polskim i orzecznictwie.",
  icons: {
    icon: "/brand/favicon-128.png",
    shortcut: "/brand/favicon-32.png",
    apple: "/brand/favicon-128.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full">
      <body className="flex min-h-screen flex-col bg-[#f5f8fc] text-slate-950">
        {/* Skip-link dla dostępności (WCAG 2.2 AA) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none"
        >
          Przejdź do treści głównej
        </a>

        {/* Nagłówek serwisu */}
        <header className="site-header sticky top-0 z-40 border-b border-white/10 bg-[#071426]/90 text-white backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-white hover:text-cyan-200 focus-visible:rounded-lg sm:text-lg"
            >
              <Image
                src="/brand/favicon.png"
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 rounded-xl object-contain sm:h-9 sm:w-9"
                priority
              />
              <span>czypodpisac<span className="text-cyan-300">.pl</span></span>
            </Link>

            <nav aria-label="Główna nawigacja" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
              <Link
                href="/#jak-dziala"
                className="rounded-lg px-2.5 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg"
              >
                Jak to działa i baza prawa
              </Link>
              <Link
                href="/#przyklad"
                className="hidden sm:inline-flex rounded-lg px-2.5 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg"
              >
                Przykładowy raport
              </Link>
              <Link
                href="/kontakt"
                className="rounded-lg px-2.5 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg"
              >
                Kontakt & Płatności P24
              </Link>
              <Link
                href="/regulamin"
                className="hidden md:inline-flex rounded-lg px-2.5 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg"
              >
                Regulamin
              </Link>
            </nav>
          </div>
        </header>

        {/* Główna treść strony */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* Stopka serwisu */}
        <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500 no-print">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 space-y-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500" aria-hidden="true" />
                <span className="font-semibold text-slate-700">Dane przetwarzamy wyłącznie w UE</span>
                <span className="text-slate-400">•</span>
                <span>Zero trenowania AI na Twoich umowach</span>
                <span className="text-slate-400">•</span>
                <span>Automatyczne usuwanie danych</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Stan prawny: 2026-10-04 (ELI Sejm, UOKiK, SN, EUR-Lex)
              </div>
            </div>

            {/* Linki regulaminowe i płatności */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1 text-left">
              <div>
                <strong className="block text-slate-800 font-bold text-sm mb-2">czypodpisac.pl</strong>
                <p className="text-slate-500 leading-relaxed text-xs">
                  Niezależna analiza ryzyka prawnego umów dla konsumentów i wykonawców. Gotowe nowe brzmienie zapisów,
                  wycena ryzyka w złotówkach i gotowe maile negocjacyjne.
                </p>
              </div>

              <div>
                <strong className="block text-slate-800 font-bold text-sm mb-2">Informacje prawne i pomoc</strong>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <Link href="/regulamin" className="hover:text-blue-700 hover:underline">
                      Regulamin świadczenia usług
                    </Link>
                  </li>
                  <li>
                    <Link href="/polityka-prywatnosci" className="hover:text-blue-700 hover:underline">
                      Polityka prywatności i RODO
                    </Link>
                  </li>
                  <li>
                    <Link href="/kontakt" className="hover:text-blue-700 hover:underline">
                      Kontakt i procedura reklamacji
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <strong className="block text-slate-800 font-bold text-sm mb-2">Bezpieczne płatności online</strong>
                <p className="text-slate-500 leading-relaxed text-xs">
                  Płatności BLIK, kartami (Visa, Mastercard) i szybkimi przelewami obsługuje operator{" "}
                  <strong className="text-slate-700">PayPro S.A. (Przelewy24)</strong>, wpisany do rejestru KNF
                  pod nr UKNF IP24/2014. Certyfikat SSL 256-bit i 3D-Secure.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[11px] text-slate-400">
              <p className="max-w-3xl leading-relaxed">
                Raport ma charakter informacyjno-analityczny i nie stanowi indywidualnej porady prawnej adwokata ani radcy
                prawnego. W sprawach o skrajnym ryzyku skorzystaj z konsultacji profesjonalnego pełnomocnika.
              </p>
              <p className="shrink-0">
                © 2026 <a href="https://multinewsroom.pl/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline underline-offset-2">Multinewsroom</a> (NIP: 525-218-92-41).
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
