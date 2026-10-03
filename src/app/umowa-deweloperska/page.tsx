import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { AlertOctagon, BookOpen, Info } from "lucide-react";
import { checklistUmowaDeweloperska } from "@/checklists/umowa-deweloperska";
import { ChecklistRegistry } from "@/checklists/registry";
import { LegalKnowledgeBase } from "@/kb";
import { PipelineOrchestrator } from "@/pipeline/orchestrator";

/**
 * Strona typu umowy (krok 6 workflow /nowy-typ-umowy).
 * Przykładowy raport NIE jest wpisany ręcznie: przy budowie strony silnik analizuje przypadek
 * „dw-16-cztery-wady” ze zbioru test-contracts/umowa-deweloperska.json, więc strona pokazuje
 * dokładnie to, co zwraca silnik. Do zatwierdzenia checklisty przez prawnika strona jest
 * wyłączona z indeksowania, bo typ umowy nie jest jeszcze aktywny.
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Umowa deweloperska: co sprawdzić przed podpisaniem — czypodpisac.pl",
  description:
    "Rachunek powierniczy, opłata rezerwacyjna, odbiór i wady, odstąpienie. Sprawdź, czego umowa deweloperska nie może ci odebrać.",
  robots: { index: false, follow: false },
};

const EXAMPLE_CASE_ID = "dw-16-cztery-wady";
const EVAL_SET_PATH = path.join(process.cwd(), "test-contracts", "umowa-deweloperska.json");
const ACT_NAME = "ustawy deweloperskiej";

interface ExampleCase {
  id: string;
  text: string;
}

function loadExampleContract(): string {
  const set = JSON.parse(fs.readFileSync(EVAL_SET_PATH, "utf8")) as { cases: ExampleCase[] };
  const example = set.cases.find((c) => c.id === EXAMPLE_CASE_ID);
  if (!example) throw new Error(`Brak przypadku ${EXAMPLE_CASE_ID} w zbiorze testowym umowy deweloperskiej.`);
  return example.text;
}

function formatLegalDate(isoDate: string): string {
  const formatted = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
  return `${formatted} r.`;
}

async function runExample() {
  const kb = LegalKnowledgeBase.getInstance();
  const registry = new ChecklistRegistry();
  registry.registerChecklist(checklistUmowaDeweloperska);
  const contractText = loadExampleContract();
  const result = await new PipelineOrchestrator(kb, registry).runFastVerdict({ contractText });
  return { contractText, report: result.report, kb };
}

function SourceLinks({ ids, kb }: { ids: string[]; kb: LegalKnowledgeBase }) {
  const units = ids.map((id) => kb.getById(id)).filter((u) => u !== undefined);
  return (
    <p className="mt-2 text-sm text-slate-700">
      <span className="font-semibold">Podstawa: </span>
      {units.map((u, i) => (
        <span key={u.id}>
          {i > 0 && ", "}
          <a href={u.sourceUrl} className="text-blue-800 underline underline-offset-2 hover:text-blue-950" rel="noopener noreferrer">
            {u.editorialUnit} {ACT_NAME}
          </a>
        </span>
      ))}
    </p>
  );
}

export default async function UmowaDeweloperskaPage() {
  const { contractText, report, kb } = await runExample();
  const legalStateDate = kb.getById("dew-art-40")?.legalStateDate;
  const publication = kb.getById("dew-art-40")?.publicationAddress;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 text-left">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Umowa deweloperska: co sprawdzić, zanim podpiszesz
      </h1>
      <p className="mt-4 text-lg text-slate-700">
        Kupujesz mieszkanie albo dom od dewelopera? Ustawa deweloperska daje ci prawa, których umowa nie może odebrać.
      </p>

      <div role="note" className="mt-6 flex gap-3 rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-800">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
        <p>
          <span className="font-semibold">Sprawdzanie umów deweloperskich jest w przygotowaniu. </span>
          Punkty kontrolne czekają na zatwierdzenie przez prawnika. Do tego czasu serwis ocenia te umowy tylko ogólną listą
          kontrolną.
        </p>
      </div>

      <section aria-labelledby="co-sprawdzamy" className="mt-12">
        <h2 id="co-sprawdzamy" className="text-2xl font-bold text-slate-900">
          Co sprawdzamy w umowie deweloperskiej
        </h2>
        {legalStateDate && publication && (
          <p className="mt-2 text-sm text-slate-700">
            Stan prawny na {formatLegalDate(legalStateDate)} Tekst jednolity: {publication}.
          </p>
        )}
        <ul className="mt-6 space-y-5">
          {checklistUmowaDeweloperska.items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">{item.area}</h3>
              <p className="mt-1 text-slate-800">{item.controlQuestion}</p>
              <SourceLinks ids={item.kbSourceIds} kb={kb} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="przyklad" className="mt-14">
        <h2 id="przyklad" className="text-2xl font-bold text-slate-900">
          Przykładowy raport
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Poniżej jest wynik naszego silnika dla umowy przygotowanej do testów. To nie jest umowa prawdziwego dewelopera.
        </p>

        <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:rounded">Pokaż treść umowy testowej</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-slate-800">{contractText}</pre>
        </details>

        <div className="mt-6 rounded-xl border-2 border-red-700 bg-red-50 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-900">
            <AlertOctagon className="h-5 w-5" aria-hidden="true" />
            Werdykt
          </p>
          <p className="mt-2 text-lg font-bold text-red-950">{report.verdictOneSentence}</p>
          <p className="mt-2 text-sm text-red-950">Liczba ryzyk czerwonych: {report.counts.red}.</p>
        </div>

        <ol className="mt-6 space-y-5">
          {report.findings.red.map((finding) => (
            <li key={finding.id} className="rounded-xl border border-red-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertOctagon className="h-4 w-4" aria-hidden="true" />
                Ryzyko czerwone
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-900">{finding.tytulPoLudzku}</h3>
              <blockquote className="mt-2 border-l-4 border-slate-300 pl-3 text-slate-800">„{finding.doslownyCytatZUmowy}”</blockquote>
              <p className="mt-2 text-slate-800">{finding.uzasadnienie}</p>
              <SourceLinks ids={finding.zweryfikowaneZrodlaIds} kb={kb} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="zrodla" className="mt-14 border-t border-slate-200 pt-6 text-sm text-slate-700">
        <h2 id="zrodla" className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Źródła i zastrzeżenia
        </h2>
        <p className="mt-2">
          Treść przepisów pobieramy z oficjalnego API Sejmu (ELI) i porównujemy z tekstem w Dzienniku Ustaw.
        </p>
        <p className="mt-2">Analiza ma charakter informacyjny i nie zastępuje porady prawnika.</p>
        <p className="mt-4">
          <Link href="/" className="font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950">
            Wróć na stronę główną
          </Link>
        </p>
      </section>
    </article>
  );
}
