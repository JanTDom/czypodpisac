// Audyt ugruntowania legal-kb: czy każda zapisana treść prawa pochodzi z oficjalnego źródła.
// Akty: porównanie treści jednostki z tekstem HTML aktu z API Sejmu ELI.
// Orzeczenia i wpisy UOKiK: sprawdzenie, czy zapisany adres źródła zwraca dokument, a nie stronę błędu.
// Wynik: docs/eval/kb-grounding-audit.json. Kod wyjścia 1, gdy jakakolwiek jednostka nie jest potwierdzona.
import fs from "node:fs";
import path from "node:path";

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

// Porównujemy fragmenty po ~12 słów; jednostka jest potwierdzona, gdy >= 90% fragmentów występuje w tekście oficjalnym.
function coverage(unitText, officialText) {
  const words = normalize(unitText).split(" ");
  const chunks = [];
  for (let i = 0; i + 12 <= words.length; i += 12) chunks.push(words.slice(i, i + 12).join(" "));
  if (chunks.length === 0) return 0;
  return chunks.filter((c) => officialText.includes(c)).length / chunks.length;
}

const officialTextCache = new Map();
async function officialActText(address) {
  if (officialTextCache.has(address)) return officialTextCache.get(address);
  const parsed = parseAddress(address);
  let result = { ok: false, reason: "nieczytelny adres publikacji", text: "" };
  if (parsed) {
    const url = `${ELI_BASE}/DU/${parsed.year}/${parsed.pos}/text.html`;
    const res = await fetchWithTimeout(url);
    result = res.ok
      ? { ok: true, url, text: normalize(await res.text()) }
      : { ok: false, url, reason: `HTTP ${res.status}`, text: "" };
  }
  officialTextCache.set(address, result);
  return result;
}

async function auditStatute(unit) {
  const official = await officialActText(unit.publicationAddress);
  if (!official.ok) return { status: "niepotwierdzona", reason: `brak tekstu oficjalnego (${official.reason})`, checkedUrl: official.url };
  const ratio = coverage(unit.content, official.text);
  return {
    status: ratio >= 0.9 ? "potwierdzona" : "niepotwierdzona",
    reason: `zgodność z tekstem ELI: ${(ratio * 100).toFixed(0)}%`,
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
