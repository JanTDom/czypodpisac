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

            <nav aria-label="Główna nawigacja" className="flex items-center gap-1.5 text-sm font-medium sm:gap-3">
              <Link
                href="/#jak-dziala"
                className="hidden rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg sm:inline-flex"
              >
                Jak to działa
              </Link>
              <Link
                href="/#przyklad"
                className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:rounded-lg"
              >
                <span className="sm:hidden">Raport</span>
                <span className="hidden sm:inline">Przykładowy raport</span>
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
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500" aria-hidden="true" />
                <span className="font-semibold text-slate-700">Dane przetwarzamy w UE</span>
                <span className="text-slate-400">•</span>
                <span>Pliki usuwamy po 7 dniach</span>
              </div>
              <div className="text-slate-400">
                Stan prawny bazy: 2026-10-03 (API Sejmu ELI)
              </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row justify-between gap-4">
              <p className="max-w-3xl leading-relaxed text-slate-500">
                Raport powstaje z użyciem AI i ma charakter informacyjny. Nie zastępuje porady prawnej.
                Przy wysokim ryzyku skonsultuj umowę z radcą prawnym lub adwokatem.
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
