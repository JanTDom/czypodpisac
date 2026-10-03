// Pobiera do legal-kb wybrane jednostki redakcyjne ustawy deweloperskiej z oficjalnego tekstu jednolitego.
// Źródło: API Sejmu ELI, Dz.U. 2026 poz. 880 (obwieszczenie z 12 czerwca 2026 r., stan prawny na 9 czerwca 2026 r.).
// API nie udostępnia tego tekstu w HTML, dlatego czytamy oficjalny PDF (scripts/lib/eli-pdf-text.mjs).
// Skrypt jest idempotentny: nadpisuje pliki legal-kb/akty/deweloperska/*.json i podmienia ich wpisy w legal-kb/index.json.
// Uruchomienie: node scripts/ingest-deweloperska.mjs, potem npm run audit:kb.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fetchEliPdfText } from "./lib/eli-pdf-text.mjs";

const ACT = {
  title:
    "Ustawa z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym",
  indexLabel: "Ustawa deweloperska",
  publicationAddress: "Dz.U. 2026 poz. 880",
  eliAddress: "DU/2021/1177",
  unifiedActEli: "DU/2026/880",
  pdfUrl: "https://api.sejm.gov.pl/eli/acts/DU/2026/880/text.pdf",
  legalStateDate: "2026-06-09",
  freshnessNotes:
    "Tekst jednolity Dz.U. 2026 poz. 880, stan prawny na 9 czerwca 2026 r. Ustawa Dz.U. 2026 poz. 1077 (wejście w życie 11 listopada 2026 r.) zmienia wyłącznie art. 19b. Część zmian z Dz.U. 2025 poz. 1669 z odroczonym wejściem w życie dotyczy art. 50–52 (Ewidencja), nie jednostek zapisanych tutaj.",
};

const KB_DIR = path.resolve("legal-kb");
const UNIT_DIR = path.join(KB_DIR, "akty", "deweloperska");
const ID_PREFIX = "dew-";
const BODY_START_MARKER = "Rozdział 1 Przepisy ogólne";
const USER_AGENT = "czypodpisac.pl legal-kb ingest";

const TAGS_DEV = ["umowa_deweloperska"];
const TAGS_DEV_RES = ["umowa_deweloperska", "umowa_rezerwacyjna"];

// Każdy wpis: artykuł, opcjonalny wycinek (od / do tekstu wewnątrz artykułu), słowa kluczowe.
const UNITS = [
  { art: "5", from: "5) nabywca", to: "7) przedsięwzięcie deweloperskie", unit: "art. 5 pkt 5–6", tags: TAGS_DEV, keywords: ["nabywca", "umowa deweloperska", "definicja"] },
  { art: "5a", tags: TAGS_DEV_RES, keywords: ["cena", "cena za metr", "powierzchnia użytkowa", "iloczyn"] },
  { art: "6", tags: TAGS_DEV, keywords: ["mieszkaniowy rachunek powierniczy", "ochrona wpłat", "rachunek powierniczy", "Deweloperski Fundusz Gwarancyjny"] },
  { art: "8", tags: TAGS_DEV, keywords: ["wpłaty", "rachunek powierniczy", "harmonogram", "etap"] },
  { art: "14", tags: TAGS_DEV, keywords: ["koszty rachunku powierniczego", "prowizje", "opłaty"] },
  { art: "21", tags: TAGS_DEV_RES, keywords: ["prospekt informacyjny", "doręczenie prospektu", "trwały nośnik"] },
  { art: "23", tags: TAGS_DEV_RES, keywords: ["prospekt informacyjny", "integralna część umowy"] },
  { art: "24", tags: TAGS_DEV, keywords: ["harmonogram", "etapy", "koszt etapu"] },
  { art: "25", tags: TAGS_DEV, keywords: ["zgoda banku", "bezobciążeniowe", "hipoteka", "wierzyciel hipoteczny"] },
  { art: "29", tags: TAGS_DEV_RES, keywords: ["umowa rezerwacyjna", "rezerwacja"] },
  { art: "30", tags: TAGS_DEV_RES, keywords: ["umowa rezerwacyjna", "forma pisemna", "rezerwacja"] },
  { art: "31", tags: TAGS_DEV_RES, keywords: ["umowa rezerwacyjna", "czas określony", "kredyt"] },
  { art: "32", tags: TAGS_DEV_RES, keywords: ["opłata rezerwacyjna", "1 % ceny", "limit opłaty rezerwacyjnej"] },
  { art: "34", tags: TAGS_DEV_RES, keywords: ["opłata rezerwacyjna", "zwrot opłaty rezerwacyjnej", "podwójna wysokość"] },
  { art: "35", tags: TAGS_DEV, keywords: ["treść umowy deweloperskiej", "elementy umowy", "termin przeniesienia", "termin odbioru"] },
  { art: "39", tags: TAGS_DEV, keywords: ["odsetki", "kary umowne", "rekompensata"] },
  { art: "40", tags: TAGS_DEV, keywords: ["akt notarialny", "aktu notarialnego", "koszty notarialne", "wynagrodzenie notariusza", "w równych częściach"] },
  { art: "41", tags: TAGS_DEV, keywords: ["odbiór", "protokół odbioru", "wady", "usunięcie wad", "usunięcia wad", "zgłoszone wady", "wada istotna", "rzeczoznawca"] },
  { art: "41a", tags: TAGS_DEV, keywords: ["rękojmia", "wady fizyczne", "wady prawne"] },
  { art: "42", tags: TAGS_DEV, keywords: ["postanowienia mniej korzystne", "nieważne", "nieważność"] },
  { art: "43", tags: TAGS_DEV, keywords: ["odstąpienie", "prawo odstąpienia", "120 dni", "wezwanie", "odstąpienie dewelopera"] },
  { art: "44", to: " 4. W terminie 30 dni od dnia otrzymania oświadczenia", unit: "art. 44 ust. 1–3", tags: TAGS_DEV, keywords: ["odstąpienie", "zapłata za odstąpienie", "odstępne", "zwrot środków", "koszty odstąpienia"] },
  { art: "45", tags: TAGS_DEV, keywords: ["oświadczenie o odstąpieniu", "księga wieczysta", "podpis notarialnie poświadczony"] },
];

const sha256 = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex");

function articleSlice(body, art) {
  const header = `Art. ${art}. `;
  const start = body.indexOf(header);
  if (start === -1) throw new Error(`Nie znaleziono nagłówka „${header.trim()}” w tekście aktu.`);
  const rest = body.slice(start + header.length);
  const nextHeader = /\sArt\. \d+[a-z]?\. /.exec(rest);
  let text = header + (nextHeader ? rest.slice(0, nextHeader.index) : rest);
  const chapter = text.indexOf(" Rozdział ");
  if (chapter !== -1) text = text.slice(0, chapter);
  return text.trim();
}

function narrow(text, from, to) {
  let out = text;
  if (from) {
    const i = out.indexOf(from);
    if (i === -1) throw new Error(`Brak fragmentu początkowego „${from}”.`);
    out = out.slice(i);
  }
  if (to) {
    const j = out.indexOf(to);
    if (j === -1) throw new Error(`Brak fragmentu końcowego „${to}”.`);
    out = out.slice(0, j);
  }
  return out.trim();
}

async function main() {
  const fullText = await fetchEliPdfText(ACT.pdfUrl, { userAgent: USER_AGENT });
  const bodyStart = fullText.indexOf(BODY_START_MARKER);
  if (bodyStart === -1) throw new Error("Nie znaleziono początku treści ustawy w tekście jednolitym.");
  const body = fullText.slice(bodyStart);
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  fs.rmSync(UNIT_DIR, { recursive: true, force: true });
  fs.mkdirSync(UNIT_DIR, { recursive: true });

  const indexEntries = [];
  for (const spec of UNITS) {
    const content = narrow(articleSlice(body, spec.art), spec.from, spec.to);
    const editorialUnit = spec.unit ?? `art. ${spec.art}`;
    const id = `${ID_PREFIX}art-${spec.art}`;
    const unit = {
      id,
      unitType: "statute",
      actTitle: ACT.title,
      publicationAddress: ACT.publicationAddress,
      editorialUnit,
      content,
      sourceUrl: ACT.pdfUrl,
      fetchDate: today,
      legalStateDate: ACT.legalStateDate,
      contentHashSha256: sha256(content),
      status: "active",
      contractTypeTags: spec.tags,
      keywords: spec.keywords,
      officialCitation: `${ACT.publicationAddress}, ${editorialUnit}`,
      eliAddress: ACT.eliAddress,
      unifiedActEli: ACT.unifiedActEli,
      lastVerifiedAt: nowIso,
      freshnessNotes: ACT.freshnessNotes,
    };
    const filePath = `akty/deweloperska/${id}.json`;
    fs.writeFileSync(path.join(KB_DIR, filePath), `${JSON.stringify(unit, null, 2)}\n`);
    indexEntries.push({
      id,
      unitType: "statute",
      editorialUnit,
      actTitle: ACT.title,
      filePath,
      legalStateDate: ACT.legalStateDate,
      status: "active",
      contractTypeTags: spec.tags,
    });
  }

  const indexPath = path.join(KB_DIR, "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const units = [...index.units.filter((u) => !u.id.startsWith(ID_PREFIX)), ...indexEntries];
  const countBy = (key) => units.reduce((acc, u) => ({ ...acc, [u[key]]: (acc[u[key]] ?? 0) + 1 }), {});
  const unitsByAct = { ...index.unitsByAct, [ACT.indexLabel]: indexEntries.length };
  const updated = {
    ...index,
    generatedAt: nowIso,
    totalUnits: units.length,
    unitsByAct,
    unitsByType: countBy("unitType"),
    units,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(updated, null, 2)}\n`);
  process.stdout.write(`Zapisano ${indexEntries.length} jednostek ustawy deweloperskiej. Razem w bazie: ${units.length}.\n`);
}

main().catch((error) => {
  process.stderr.write(`Błąd pobierania ustawy deweloperskiej: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
