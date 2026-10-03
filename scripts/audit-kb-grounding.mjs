// Audyt ugruntowania legal-kb: czy każda zapisana treść prawa pochodzi z oficjalnego źródła.
// Akty: porównanie treści jednostki z tekstem HTML aktu z API Sejmu ELI (albo z oficjalnym PDF, gdy HTML jest pusty).
// Orzeczenia i wpisy UOKiK: sprawdzenie, czy zapisany adres źródła zwraca dokument, a nie stronę błędu.
// Wynik: docs/eval/kb-grounding-audit.json. Kod wyjścia 1, gdy jakakolwiek jednostka nie jest potwierdzona.
import fs from "node:fs";
import path from "node:path";
import { fetchEliPdfText } from "./lib/eli-pdf-text.mjs";

const KB_DIR = "legal-kb";
const OUT_FILE = "docs/eval/kb-grounding-audit.json";
const ELI_BASE = "https://api.sejm.gov.pl/eli/acts";
const TIMEOUT_MS = 20000;
const MIN_DOCUMENT_BYTES = 5000;

const normalize = (text) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/[\u00a0\s]+/g, " ")
    .replace(/[„”"]/g, '"')
    .toLowerCase()
    .trim();

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

function readUnits(dir) {
  const units = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) units.push(...readUnits(full));
    else if (entry.name.endsWith(".json") && entry.name !== "index.json") {
      units.push({ file: full, data: JSON.parse(fs.readFileSync(full, "utf8")) });
    }
  }
  return units;
}

function parseAddress(address) {
  const match = /Dz\.U\.\s*(\d{4})\s*poz\.\s*(\d+)/.exec(address ?? "");
  return match ? { year: match[1], pos: match[2] } : null;
}

// Porównujemy fragmenty po 12 słów, łącznie z ostatnimi 12 słowami jednostki.
// Jednostka jest potwierdzona tylko, gdy KAŻDY fragment występuje w tekście oficjalnym:
// przy progu 90% zmiana jednej liczby (np. „1 %” na „5 %”) przechodziła niezauważona.
const CHUNK_WORDS = 12;
function coverage(unitText, officialText) {
  const words = normalize(unitText).split(" ");
  if (words.length < CHUNK_WORDS) {
    const found = officialText.includes(words.join(" "));
    return { ratio: found ? 1 : 0, missing: found ? 0 : 1 };
  }
  const chunks = [];
  for (let i = 0; i + CHUNK_WORDS <= words.length; i += CHUNK_WORDS) chunks.push(words.slice(i, i + CHUNK_WORDS).join(" "));
  chunks.push(words.slice(-CHUNK_WORDS).join(" "));
  const missing = chunks.filter((c) => !officialText.includes(c)).length;
  return { ratio: (chunks.length - missing) / chunks.length, missing };
}

// Część tekstów jednolitych API ELI udostępnia tylko w PDF (HTML zwraca pustą odpowiedź).
// Wtedy porównujemy z oficjalnym PDF, czytanym tym samym kodem co przy pobieraniu do legal-kb.
async function officialActTextFromPdf(parsed) {
  const url = `${ELI_BASE}/DU/${parsed.year}/${parsed.pos}/text.pdf`;
  const text = await fetchEliPdfText(url, { timeoutMs: TIMEOUT_MS });
  return text.length >= MIN_DOCUMENT_BYTES
    ? { ok: true, url, text: normalize(text) }
    : { ok: false, url, reason: "PDF bez treści", text: "" };
}

const officialTextCache = new Map();
async function officialActText(address) {
  if (officialTextCache.has(address)) return officialTextCache.get(address);
  const parsed = parseAddress(address);
  let result = { ok: false, reason: "nieczytelny adres publikacji", text: "" };
  if (parsed) {
    const url = `${ELI_BASE}/DU/${parsed.year}/${parsed.pos}/text.html`;
    const res = await fetchWithTimeout(url);
    const html = res.ok ? await res.text() : "";
    if (res.ok && html.length >= MIN_DOCUMENT_BYTES) result = { ok: true, url, text: normalize(html) };
    else if (res.ok) result = await officialActTextFromPdf(parsed);
    else result = { ok: false, url, reason: `HTTP ${res.status}`, text: "" };
  }
  officialTextCache.set(address, result);
  return result;
}

async function auditStatute(unit) {
  const official = await officialActText(unit.publicationAddress);
  if (!official.ok) return { status: "niepotwierdzona", reason: `brak tekstu oficjalnego (${official.reason})`, checkedUrl: official.url };
  const { ratio, missing } = coverage(unit.content, official.text);
  return {
    status: missing === 0 && ratio === 1 ? "potwierdzona" : "niepotwierdzona",
    reason: `zgodność z tekstem ELI: ${(ratio * 100).toFixed(1)}% (fragmenty niezgodne: ${missing})`,
    checkedUrl: official.url,
  };
}

async function auditDocumentLink(unit) {
  if (!unit.sourceUrl) return { status: "niepotwierdzona", reason: "brak adresu źródła" };
  const res = await fetchWithTimeout(unit.sourceUrl);
  const body = await res.arrayBuffer();
  const type = res.headers.get("content-type") ?? "";
  const looksLikeDocument = res.ok && body.byteLength >= MIN_DOCUMENT_BYTES;
  return {
    status: looksLikeDocument ? "do-recznej-weryfikacji" : "niepotwierdzona",
    reason: `HTTP ${res.status}, ${type}, ${body.byteLength} B${looksLikeDocument ? "" : " — źródło nie zwraca dokumentu"}`,
    checkedUrl: unit.sourceUrl,
  };
}

const results = [];
for (const { file, data } of readUnits(KB_DIR)) {
  let outcome;
  try {
    outcome = data.unitType === "statute" ? await auditStatute(data) : await auditDocumentLink(data);
  } catch (error) {
    outcome = { status: "niepotwierdzona", reason: `błąd sieci: ${error instanceof Error ? error.message : String(error)}` };
  }
  results.push({ id: data.id, unitType: data.unitType, file, ...outcome });
}

const summary = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), summary, results }, null, 2));
process.stdout.write(`${JSON.stringify(summary)}\n`);
for (const r of results.filter((x) => x.status !== "potwierdzona")) {
  process.stdout.write(`${r.status}\t${r.id}\t${r.reason}\n`);
}
process.exit(results.every((r) => r.status === "potwierdzona") ? 0 : 1);
