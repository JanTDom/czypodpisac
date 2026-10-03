import { IngestOutput } from "../schemas/stage01-ingest";
import {
  SegmentationOutput,
  ExtractedClause,
  ExtractedAttachment,
} from "../schemas/stage03-segmentation";

/**
 * Etap 3: Segmentacja umowy
 * Dzieli pełny tekst na logiczne jednostki redakcyjne (§, ust., pkt, art.),
 * mapuje strony, odwołania wewnętrzne i załączniki.
 */
export async function executeSegmentation(
  ingestOutput: IngestOutput
): Promise<SegmentationOutput> {
  const clauses: ExtractedClause[] = [];
  const attachments: ExtractedAttachment[] = [];
  const definitions: Record<string, string> = {};

  // Wzorzec podziału na paragrafy lub artykuły
  const regex = /(?:^|\n)\s*(?:(§\s*\d+[a-z]*|Art\.\s*\d+[a-z]*|Rozdział\s+[IVXLCDM\d]+|Pkt\s*\d+)\.?)\s*(.*?)(?=(?:\n\s*(?:§\s*\d+|Art\.\s*\d+|Rozdział\s+[IVXLCDM\d]+|Pkt\s*\d+)\.?)|\n--- Strona|$)/gis;

  let match: RegExpExecArray | null;
  let clauseIndex = 1;

  // Sprawdzamy wystąpienia w pełnym tekście
  while ((match = regex.exec(ingestOutput.fullText)) !== null) {
    const rawNumber = match[1]?.trim() || `§ ${clauseIndex}`;
    const rawBody = match[2]?.trim() || "";
    if (rawBody.length < 5) continue;

    // Próba wyodrębnienia tytułu (np. "§ 1 [Przedmiot umowy]")
    let title: string | undefined;
    let textContent = rawBody;

    const titleMatch = rawBody.match(/^\[?(.*?)\]?\s*\n(.*)$/s);
    if (titleMatch && titleMatch[1].length < 80) {
      title = titleMatch[1].replace(/[\[\]]/g, "").trim();
      textContent = titleMatch[2].trim();
    }

    // Ustalenie numeru strony na podstawie bloków z IngestOutput
    let pageNumber = 1;
    for (const page of ingestOutput.pages) {
      if (page.rawText.includes(textContent.slice(0, 50))) {
        pageNumber = page.pageNumber;
        break;
      }
    }

    // Wykrycie odwołań wewnętrznych (np. "zgodnie z § 4 ust. 2")
    const internalReferences: string[] = [];
    const refMatches = textContent.matchAll(/(?:§|art\.)\s*(\d+[a-z]*)/gi);
    for (const rm of refMatches) {
      const refStr = `§ ${rm[1]}`;
      if (!internalReferences.includes(refStr)) {
        internalReferences.push(refStr);
      }
    }

    clauses.push({
      id: `clause-${clauseIndex++}`,
      clauseNumber: rawNumber,
      title,
      fullText: textContent,
      pageNumber,
      internalReferences,
      subItems: [],
    });
  }

  // Fallback: jeśli umowa nie miała standardowych symboli §, dzielimy po akapitach
  if (clauses.length === 0) {
    let pIdx = 1;
    for (const page of ingestOutput.pages) {
      for (const block of page.blocks) {
        if (block.text.length > 30) {
          clauses.push({
            id: `clause-${pIdx}`,
            clauseNumber: `Ustęp ${pIdx++}`,
            fullText: block.text,
            pageNumber: page.pageNumber,
            internalReferences: [],
            subItems: [],
          });
        }
      }
    }
  }

  // Wykrywanie wzmianek o załącznikach (np. "Załącznik nr 1")
  const attachMatches = ingestOutput.fullText.matchAll(/załącznik(?:iem|u|ów)?\s*nr\s*([0-9A-Za-z]+)/gi);
  let attachIdx = 1;
  const recordedNames = new Set<string>();

  for (const am of attachMatches) {
    const name = `Załącznik nr ${am[1]}`;
    if (!recordedNames.has(name)) {
      recordedNames.add(name);
      attachments.push({
        id: `att-${attachIdx++}`,
        name,
        presentInDocument: ingestOutput.fullText.toLowerCase().includes(name.toLowerCase()),
        pageNumber: 1,
      });
    }
  }

  return {
    clauses,
    attachments,
    definitions,
    totalClausesCount: clauses.length,
  };
}
