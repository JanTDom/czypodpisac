import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        {/* Skip-link dla dostępności (WCAG 2.2 AA) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none"
        >
          Przejdź do treści głównej
        </a>

        {/* Nagłówek serwisu */}
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 hover:text-blue-700 focus-visible:rounded"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-extrabold text-sm">
                CZP
              </span>
              <span>czypodpisac<span className="text-blue-700">.pl</span></span>
            </Link>

            <nav aria-label="Główna nawigacja" className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/#przyklad"
                className="text-slate-600 hover:text-slate-900 focus-visible:rounded px-2 py-1"
              >
                Przykładowy raport
              </Link>
              <Link
                href="/admin"
                className="text-slate-500 hover:text-slate-900 focus-visible:rounded px-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100"
              >
                Panel administratora
              </Link>
            </nav>
          </div>
        </header>

        {/* Główna treść strony */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* Stopka serwisu */}
        <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 no-print">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="font-semibold text-slate-700">Centrum danych UE (Frankfurt / Warszawa)</span>
                <span className="text-slate-400">•</span>
                <span>Automatyczne usuwanie po 7 dniach</span>
              </div>
              <div className="text-slate-400">
                Stan prawny bazy: 2026-10-03 (API Sejmu ELI)
              </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row justify-between gap-4">
              <p className="max-w-2xl text-slate-500 leading-relaxed">
                Raport jest generowany przy użyciu dedykowanego systemu sztucznej inteligencji czypodpisac.pl.
                Ma charakter informacyjno-edukacyjny i projektowy; nie stanowi pomocy prawnej w rozumieniu ustawy o radcach prawnych.
                Przed podpisaniem umów o skrajnym ryzyku zawsze zalecamy bezpośrednią konsultację z radcą prawnym lub adwokatem.
              </p>
              <p className="text-slate-400 self-start md:self-end">
                © 2026 <a href="https://multinewsroom.pl/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline underline-offset-2">Multinewsroom</a>. Wszelkie prawa zastrzeżone.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
