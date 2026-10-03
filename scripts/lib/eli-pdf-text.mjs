// Odczyt tekstu aktu prawnego z oficjalnego PDF Dziennika Ustaw (API Sejmu ELI).
// Używane, gdy API nie udostępnia wersji HTML danego tekstu jednolitego (pole textHTML = false).
// Ten sam odczyt stosują: skrypt pobierający jednostki do legal-kb oraz audyt ugruntowania,
// więc treść zapisana w bazie i tekst referencyjny są normalizowane identycznie.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const PAGE_MARKER = "\u0000PAGE\u0000";
// Linia y (w punktach PDF) zmienia się przy przejściu do nowego wiersza; drobne różnice to indeksy górne.
const LINE_BREAK_DELTA_Y = 2;
const FOOTNOTE_START = /^(Dodan[yaeo]|Uchylon[yaeo]|Zmiany tekstu|W brzmieniu|W tym brzmieniu|Ze zmianą|Wprowadzenie do wyliczenia|Rozdział dodany|Utraci)/;
const RUNNING_HEADER = /^Dziennik Ustaw\s*–\s*\d+\s*–\s*Poz\.\s*\d+$/;
const FOOTNOTE_REFERENCE = /^(\d+\)|\[\d+\])\s*$/;

async function pdfToLines(pdfBytes) {
  const doc = await getDocument({ data: new Uint8Array(pdfBytes), verbosity: 0 }).promise;
  const lines = [];
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    let current = "";
    let lastY = null;
    for (const item of content.items) {
      if (typeof item.str !== "string") continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > LINE_BREAK_DELTA_Y) {
        lines.push(current);
        current = "";
      }
      current += item.str;
      lastY = y;
    }
    lines.push(current, PAGE_MARKER);
  }
  return lines;
}

// Usuwa nagłówki stron, przypisy na dole strony i odsyłacze do przypisów.
function stripLayout(lines) {
  const kept = [];
  let insideFootnote = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === PAGE_MARKER) {
      insideFootnote = false;
      continue;
    }
    if (insideFootnote || RUNNING_HEADER.test(line)) continue;
    if (FOOTNOTE_REFERENCE.test(line)) {
      const next = (lines[i + 1] ?? "").trim();
      if (FOOTNOTE_START.test(next)) insideFootnote = true;
      continue;
    }
    kept.push(line);
  }
  return kept;
}

function joinLines(lines) {
  return lines
    .join("\n")
    // „m” + indeks górny „2” rozbite na osobne wiersze.
    .replace(/\bm\n2 ?\n/g, "m² ")
    // Przeniesienie wyrazu z dywizem na końcu wiersza.
    .replace(/([a-ząćęłńóśźż])-\n([a-ząćęłńóśźż])/g, "$1$2")
    .replace(/\n/g, " ")
    // PDF gubi spację po „nie” w tych zwrotach przez kerning.
    .replace(/\bnie(później|więcej)\b/g, "nie $1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchEliPdfText(pdfUrl, { timeoutMs = 30000, userAgent } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: userAgent ? { "User-Agent": userAgent } : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} dla ${pdfUrl}`);
    const bytes = await res.arrayBuffer();
    return joinLines(stripLayout(await pdfToLines(bytes)));
  } finally {
    clearTimeout(timer);
  }
}
