import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { LegalKbUnit, LegalKbUnitSchema, LegalKbIndex } from "../src/kb/types";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function cleanHtmlText(htmlSnippet: string): string {
  return htmlSnippet
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchStatuteHtml(url: string): Promise<string> {
  console.log(`Pobieranie aktu z: ${url}...`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "UmowaCheckLegalIngestion/1.0 (https://umowacheck.pl; biuro@umowacheck.pl)",
    },
  });
  if (!response.ok) {
    throw new Error(`Błąd pobierania aktu ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

function extractArticleFromHtml(
  html: string,
  articleIdRegex: RegExp,
  articleTitle: string
): string {
  const match = html.match(articleIdRegex);
  if (!match) {
    throw new Error(`Nie znaleziono jednostki redakcyjnej dla wzorca ${articleIdRegex}`);
  }
  let cleaned = cleanHtmlText(match[0]);
  const artIdx = cleaned.search(/\bArt\.\s*/i);
  if (artIdx !== -1) {
    cleaned = cleaned.slice(artIdx).trim();
  }
  return cleaned;
}

async function main() {
  const kbRoot = path.resolve(process.cwd(), "legal-kb");
  const uoplDir = path.join(kbRoot, "akty", "uopl");
  const kcDir = path.join(kbRoot, "akty", "kc");
  const uokikDir = path.join(kbRoot, "uokik");
  const courtDir = path.join(kbRoot, "orzecznictwo");

  for (const d of [uoplDir, kcDir, uokikDir, courtDir]) {
    fs.mkdirSync(d, { recursive: true });
  }

  const today = new Date().toISOString().split("T")[0];
  const allUnits: LegalKbUnit[] = [];

  // ============================================================================
  // 1. USTAWA O OCHRONIE PRAW LOKATORÓW (Dz.U. 2023 poz. 725)
  // ============================================================================
  const uoplUrl = "https://api.sejm.gov.pl/eli/acts/DU/2023/725/text.html";
  const uoplIsapUrl = "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230000725";
  const uoplLegalState = "2023-03-09";
  const uoplActTitle =
    "Ustawa z dnia 21 czerwca 2001 r. o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego";
  const uoplPubAddress = "Dz.U. 2023 poz. 725";

  let uoplHtml = "";
  try {
    uoplHtml = await fetchStatuteHtml(uoplUrl);
  } catch (err) {
    console.error("Błąd pobierania UoPL z API Sejmu:", err);
    throw err;
  }

  const uoplArticles = [
    {
      id: "uopl-art-2",
      editorialUnit: "art. 2",
      regex: /id="chpt_1-arti_2"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "najem_instytucjonalny"],
      keywords: ["definicje", "lokator", "właściciel", "opłaty niezależne"],
    },
    {
      id: "uopl-art-5",
      editorialUnit: "art. 5",
      regex: /id="chpt_2-arti_5"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["stan lokalu", "przydatność do umówionego użytku", "utrzymanie lokalu"],
    },
    {
      id: "uopl-art-6",
      editorialUnit: "art. 6",
      regex: /id="chpt_2-arti_6"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["kaucja", "limit kaucji", "12-krotność", "zwrot kaucji", "waloryzacja", "miesiąc"],
    },
    {
      id: "uopl-art-6a",
      editorialUnit: "art. 6a",
      regex: /id="chpt_2-arti_6a"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["obowiązki wynajmującego", "instalacje", "naprawy główne", "wymiana pieców"],
    },
    {
      id: "uopl-art-6b",
      editorialUnit: "art. 6b",
      regex: /id="chpt_2-arti_6b"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["obowiązki najemcy", "drobne naprawy", "malowanie", "konserwacja podłóg"],
    },
    {
      id: "uopl-art-6c",
      editorialUnit: "art. 6c",
      regex: /id="chpt_2-arti_6c"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["protokół zdawczo-odbiorczy", "stan lokalu", "przekazanie"],
    },
    {
      id: "uopl-art-6d",
      editorialUnit: "art. 6d",
      regex: /id="chpt_2-arti_6d"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["ulepszenia", "zgoda właściciela", "nakłady"],
    },
    {
      id: "uopl-art-6e",
      editorialUnit: "art. 6e",
      regex: /id="chpt_2-arti_6e"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["zwrot lokalu", "odnowienie lokalu", "zużycie"],
    },
    {
      id: "uopl-art-8a",
      editorialUnit: "art. 8a",
      regex: /id="chpt_2-arti_8a"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["podwyżka czynszu", "termin wypowiedzenia", "3 miesiące", "uzasadnienie podwyżki", "inflacja"],
    },
    {
      id: "uopl-art-9",
      editorialUnit: "art. 9",
      regex: /id="chpt_2-arti_9"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["opłaty niezależne", "media", "rozliczenie opłat"],
    },
    {
      id: "uopl-art-11",
      editorialUnit: "art. 11",
      regex: /id="chpt_2-arti_11"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["wypowiedzenie najmu", "katalog przyczyn", "forma pisemna", "zaległość czynsz", "3 okresy", "miesiąc uprzedzenie"],
    },
    {
      id: "uopl-art-19a",
      editorialUnit: "art. 19a",
      regex: /id="chpt_2a-arti_19a"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_okazjonalny"],
      keywords: ["najem okazjonalny", "oświadczenie notarialne", "art 777", "inny lokal", "10 lat"],
    },
    {
      id: "uopl-art-19b",
      editorialUnit: "art. 19b",
      regex: /id="chpt_2a-arti_19b"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_okazjonalny"],
      keywords: ["zgłoszenie do urzędu skarbowego", "14 dni", "naczelnik US"],
    },
    {
      id: "uopl-art-19c",
      editorialUnit: "art. 19c",
      regex: /id="chpt_2a-arti_19c"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_okazjonalny"],
      keywords: ["kaucja najem okazjonalny", "limit 6-krotność", "zwrot kaucji"],
    },
    {
      id: "uopl-art-19d",
      editorialUnit: "art. 19d",
      regex: /id="chpt_2a-arti_19d"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_okazjonalny"],
      keywords: ["wygaśnięcie umowy", "żądanie opróżnienia lokalu", "egzekucja"],
    },
    {
      id: "uopl-art-19e",
      editorialUnit: "art. 19e",
      regex: /id="chpt_2a-arti_19e"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_okazjonalny"],
      keywords: ["wyłączenie przepisów UoPL", "ograniczenie ochrony"],
    },
  ];

  for (const art of uoplArticles) {
    const content = extractArticleFromHtml(uoplHtml, art.regex, art.editorialUnit);
    const unit: LegalKbUnit = {
      id: art.id,
      unitType: "statute",
      actTitle: uoplActTitle,
      publicationAddress: uoplPubAddress,
      editorialUnit: art.editorialUnit,
      content,
      sourceUrl: uoplIsapUrl,
      fetchDate: today,
      legalStateDate: uoplLegalState,
      contentHashSha256: sha256(content),
      status: "active",
      contractTypeTags: art.tags,
      keywords: art.keywords,
      officialCitation: `${uoplPubAddress}, ${art.editorialUnit}`,
    };
    LegalKbUnitSchema.parse(unit);
    fs.writeFileSync(path.join(uoplDir, `${art.id}.json`), JSON.stringify(unit, null, 2), "utf8");
    allUnits.push(unit);
    console.log(`Zapisano jednostkę: ${art.id} (${art.editorialUnit})`);
  }

  // ============================================================================
  // 2. KODEKS CYWILNY (Dz.U. 2024 poz. 1061)
  // ============================================================================
  const kcUrl = "https://api.sejm.gov.pl/eli/acts/DU/2024/1061/text.html";
  const kcIsapUrl = "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240001061";
  const kcLegalState = "2024-06-19";
  const kcActTitle = "Ustawa z dnia 23 kwietnia 1964 r. - Kodeks cywilny";
  const kcPubAddress = "Dz.U. 2024 poz. 1061";

  let kcHtml = "";
  try {
    kcHtml = await fetchStatuteHtml(kcUrl);
  } catch (err) {
    console.error("Błąd pobierania Kodeksu cywilnego z API Sejmu:", err);
    throw err;
  }

  const kcArticles = [
    {
      id: "kc-art-385-1",
      editorialUnit: "art. 385¹",
      regex: /data-id="arti_385_1"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "konsument"],
      keywords: ["klauzula niedozwolona", "klauzula abuzywna", "dobre obyczaje", "rażące naruszenie", "brak związania"],
    },
    {
      id: "kc-art-385-2",
      editorialUnit: "art. 385²",
      regex: /data-id="arti_385_2"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "konsument"],
      keywords: ["ocena abuzywności", "stan z chwili zawarcia umowy"],
    },
    {
      id: "kc-art-385-3",
      editorialUnit: "art. 385³",
      regex: /data-id="arti_385_3"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "konsument"],
      keywords: ["katalog klauzul abuzywnych", "kara umowna", "jednostronna zmiana", "wyłączenie sądu"],
    },
    {
      id: "kc-art-385-5",
      editorialUnit: "art. 385⁵",
      regex: /data-id="arti_385_5"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "b2b_uslugi_freelancer"],
      keywords: ["przedsiębiorca na prawach konsumenta", "jednoosobowa działalność gospodarcza", "charakter zawodowy"],
    },
    {
      id: "kc-art-659",
      editorialUnit: "art. 659",
      regex: /data-id="arti_659"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["umowa najmu", "istota najmu", "czynsz", "używanie rzeczy"],
    },
    {
      id: "kc-art-660",
      editorialUnit: "art. 660",
      regex: /data-id="arti_660"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["forma pisemna", "najem na czas dłuższy niż rok", "czas nieoznaczony"],
    },
    {
      id: "kc-art-662",
      editorialUnit: "art. 662",
      regex: /data-id="arti_662"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["stan przydatny do użytku", "drobne nakłady", "utrzymanie rzeczy"],
    },
    {
      id: "kc-art-663",
      editorialUnit: "art. 663",
      regex: /data-id="arti_663"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["naprawy obciążające wynajmującego", "wykonanie zastępcze", "termin na naprawę"],
    },
    {
      id: "kc-art-664",
      editorialUnit: "art. 664",
      regex: /data-id="arti_664"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["rękojmia za wady", "obniżenie czynszu", "wypowiedzenie bez zachowania terminów", "wady lokalu"],
    },
    {
      id: "kc-art-666",
      editorialUnit: "art. 666",
      regex: /data-id="arti_666"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["sposób używania rzeczy", "przeznaczenie", "piecza"],
    },
    {
      id: "kc-art-667",
      editorialUnit: "art. 667",
      regex: /data-id="arti_667"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["zmiany w rzeczy", "zakaz zmian bez zgody", "upomnienie"],
    },
    {
      id: "kc-art-668",
      editorialUnit: "art. 668",
      regex: /data-id="arti_668"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["podnajem", "bezpłatne używanie", "zgoda wynajmującego"],
    },
    {
      id: "kc-art-669",
      editorialUnit: "art. 669",
      regex: /data-id="arti_669"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["płatność czynszu", "terminy płatności", "do 10 dnia miesiąca"],
    },
    {
      id: "kc-art-672",
      editorialUnit: "art. 672",
      regex: /data-id="arti_672"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["zwłoka z zapłatą czynszu", "wypowiedzenie bez zachowania terminów"],
    },
    {
      id: "kc-art-673",
      editorialUnit: "art. 673",
      regex: /data-id="arti_673"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["terminy wypowiedzenia", "czas nieoznaczony", "czas oznaczony", "ważne przyczyny w umowie"],
    },
    {
      id: "kc-art-675",
      editorialUnit: "art. 675",
      regex: /data-id="arti_675"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["zwrot rzeczy", "stan niepogorszony", "prawidłowe używanie", "zużycie"],
    },
    {
      id: "kc-art-677",
      editorialUnit: "art. 677",
      regex: /data-id="arti_677"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["przedawnienie roszczeń", "rok od zwrotu rzeczy", "nakłady"],
    },
    {
      id: "kc-art-680",
      editorialUnit: "art. 680",
      regex: /data-id="arti_680"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["najem lokalu", "przepisy ogólne"],
    },
    {
      id: "kc-art-681",
      editorialUnit: "art. 681",
      regex: /data-id="arti_681"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["drobne nakłady", "naprawa podłóg", "okna", "drzwi", "malowanie"],
    },
    {
      id: "kc-art-683",
      editorialUnit: "art. 683",
      regex: /data-id="arti_683"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["terminy płatności czynszu lokalu"],
    },
    {
      id: "kc-art-684",
      editorialUnit: "art. 684",
      regex: /data-id="arti_684"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["instalacja oświetlenia", "gaz", "woda", "telefon", "przywrócenie stanu"],
    },
    {
      id: "kc-art-685",
      editorialUnit: "art. 685",
      regex: /data-id="arti_685"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["porządek domowy", "rażące wykraczanie", "wypowiedzenie bez zachowania terminów"],
    },
    {
      id: "kc-art-685-1",
      editorialUnit: "art. 685¹",
      regex: /data-id="arti_685_1"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["wypowiedzenie wysokości czynszu", "podwyżka czynszu"],
    },
    {
      id: "kc-art-688",
      editorialUnit: "art. 688",
      regex: /data-id="arti_688"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["ustawowe terminy wypowiedzenia", "3 miesiące", "koniec miesiąca kalendarzowego"],
    },
    {
      id: "kc-art-688-1",
      editorialUnit: "art. 688¹",
      regex: /data-id="arti_688_1"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["odpowiedzialność solidarna", "współmieszkańcy", "zapłata czynszu"],
    },
    {
      id: "kc-art-691",
      editorialUnit: "art. 691",
      regex: /data-id="arti_691"[\s\S]*?(?=<div class="unit unit_arti|<div class="unit unit_chpt|$)/,
      tags: ["najem_lokalu_mieszkalnego"],
      keywords: ["śmierć najemcy", "wstąpienie w stosunek najmu", "małżonek", "dzieci", "wspólne pożycie"],
    },
  ];

  for (const art of kcArticles) {
    const content = extractArticleFromHtml(kcHtml, art.regex, art.editorialUnit);
    const unit: LegalKbUnit = {
      id: art.id,
      unitType: "statute",
      actTitle: kcActTitle,
      publicationAddress: kcPubAddress,
      editorialUnit: art.editorialUnit,
      content,
      sourceUrl: kcIsapUrl,
      fetchDate: today,
      legalStateDate: kcLegalState,
      contentHashSha256: sha256(content),
      status: "active",
      contractTypeTags: art.tags,
      keywords: art.keywords,
      officialCitation: `${kcPubAddress}, ${art.editorialUnit}`,
    };
    LegalKbUnitSchema.parse(unit);
    fs.writeFileSync(path.join(kcDir, `${art.id}.json`), JSON.stringify(unit, null, 2), "utf8");
    allUnits.push(unit);
    console.log(`Zapisano jednostkę: ${art.id} (${art.editorialUnit})`);
  }

  // ============================================================================
  // 3. REJESTR KLAUZUL NIEDOZWOLONYCH UOKiK DLA NAJMU
  // ============================================================================
  const uokikEntries = [
    {
      id: "uokik-klauzula-4991",
      signature: "XVII AmC 511/12",
      entryNumber: "4991",
      editorialUnit: "Wpis nr 4991 (SOKiK XVII AmC 511/12)",
      content:
        "Wynajmujący ma prawo wstępu do wynajmowanego Lokalu pod nieobecność Najemcy w każdym czasie, celem dokonania inspekcji stanu technicznego lub sanitarno-porządkowego Lokalu.",
      sourceUrl: "https://rejestr.uokik.gov.pl/pozycja.php?istn=1&numer=4991",
      legalStateDate: "2013-06-18",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["inspekcja lokalu", "wstęp pod nieobecność", "prawo do prywatności", "klauzula abuzywna"],
    },
    {
      id: "uokik-klauzula-2487",
      signature: "XVII AmC 123/11",
      entryNumber: "2487",
      editorialUnit: "Wpis nr 2487 (SOKiK XVII AmC 123/11)",
      content:
        "W przypadku opóźnienia w zapłacie czynszu najmu lub innych opłat eksploatacyjnych Najemca zobowiązany jest do zapłaty kary umownej w wysokości 50 zł za każdy dzień opóźnienia.",
      sourceUrl: "https://rejestr.uokik.gov.pl/pozycja.php?istn=1&numer=2487",
      legalStateDate: "2011-09-29",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["kara umowna za opóźnienie", "świadczenie pieniężne", "odsetki maksymalne", "podwójna sankcja"],
    },
    {
      id: "uokik-klauzula-2045",
      signature: "XVII AmC 98/10",
      entryNumber: "2045",
      editorialUnit: "Wpis nr 2045 (SOKiK XVII AmC 98/10)",
      content:
        "W przypadku wcześniejszego rozwiązania umowy przez Najemcę lub rozwiązania umowy z winy Najemcy, wpłacona kaucja nie podlega zwrotowi i przepada na rzecz Wynajmującego jako zryczałtowane odszkodowanie.",
      sourceUrl: "https://rejestr.uokik.gov.pl/pozycja.php?istn=1&numer=2045",
      legalStateDate: "2010-11-15",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["przepadek kaucji", "odszkodowanie zryczałtowane", "kara umowna ukryta w kaucji"],
    },
    {
      id: "uokik-klauzula-592",
      signature: "XVII AmC 192/05",
      entryNumber: "592",
      editorialUnit: "Wpis nr 592 (SOKiK XVII AmC 192/05)",
      content:
        "Wynajmujący może rozwiązać umowę ze skutkiem natychmiastowym w przypadku zalegania przez Najemcę z zapłatą czynszu za okres 14 dni, bez konieczności wyznaczania dodatkowego terminu.",
      sourceUrl: "https://rejestr.uokik.gov.pl/pozycja.php?istn=1&numer=592",
      legalStateDate: "2006-04-12",
      contractTypeTags: ["najem_lokalu_mieszkalnego"],
      keywords: ["natychmiastowe rozwiązanie umowy", "ominięcie art 11 uopl", "brak uprzedzenia"],
    },
    {
      id: "uokik-klauzula-6124",
      signature: "XVII AmC 1205/13",
      entryNumber: "6124",
      editorialUnit: "Wpis nr 6124 (SOKiK XVII AmC 1205/13)",
      content:
        "Najemca oświadcza, że zapoznał się ze stanem technicznym lokalu i zrzeka się wszelkich roszczeń z tytułu wad lokalu, w tym prawa do żądania obniżenia czynszu lub rozwiązania umowy.",
      sourceUrl: "https://rejestr.uokik.gov.pl/pozycja.php?istn=1&numer=6124",
      legalStateDate: "2015-08-04",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["wyłączenie rękojmi", "zrzeczenie się roszczeń", "wady lokalu", "obniżenie czynszu"],
    },
  ];

  for (const item of uokikEntries) {
    const unit: LegalKbUnit = {
      id: item.id,
      unitType: "uokik_clause",
      actTitle: "Rejestr Klauzul Niedozwolonych UOKiK / SOKiK",
      publicationAddress: `Sygn. akt ${item.signature}, wpis nr ${item.entryNumber}`,
      editorialUnit: item.editorialUnit,
      content: item.content,
      sourceUrl: item.sourceUrl,
      fetchDate: today,
      legalStateDate: item.legalStateDate,
      contentHashSha256: sha256(item.content),
      status: "active",
      contractTypeTags: item.contractTypeTags,
      keywords: item.keywords,
      officialCitation: `UOKiK Rejestr nr ${item.entryNumber} (${item.signature})`,
    };
    LegalKbUnitSchema.parse(unit);
    fs.writeFileSync(path.join(uokikDir, `${item.id}.json`), JSON.stringify(unit, null, 2), "utf8");
    allUnits.push(unit);
    console.log(`Zapisano klauzulę UOKiK: ${item.id}`);
  }

  // ============================================================================
  // 4. KLUCZOWE ORZECZNICTWO SĄDU NAJWYŻSZEGO I TSUE
  // ============================================================================
  const courtEntries = [
    {
      id: "sn-iii-czp-11-13",
      actTitle: "Uchwała Sądu Najwyższego z dnia 5 kwietnia 2013 r., sygn. III CZP 11/13",
      editorialUnit: "Uchwała SN III CZP 11/13 (teza)",
      content:
        "Przepisy art. 11 ust. 1 i 2 ustawy z dnia 21 czerwca 2001 r. o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego mają charakter bezwzględnie obowiązujący (ius cogens). Postanowienia umowy najmu lokalu mieszkalnego przewidujące możliwość wypowiedzenia umowy przez wynajmującego z przyczyn innych niż określone w ustawie lub z zachowaniem krótszych terminów są nieważne jako sprzeczne z ustawą (art. 58 § 1 k.c.).",
      sourceUrl: "http://www.sn.pl/sites/orzecznictwo/orzeczenia3/iii%20czp%2011-13.pdf",
      legalStateDate: "2013-04-05",
      contractTypeTags: ["najem_lokalu_mieszkalnego"],
      keywords: ["ius cogens", "bezwzględnie obowiązujące", "art 11 uopl", "nieważność postanowień sprzecznych"],
    },
    {
      id: "sn-v-csk-31-08",
      actTitle: "Wyrok Sądu Najwyższego z dnia 19 czerwca 2008 r., sygn. V CSK 31/08",
      editorialUnit: "Wyrok SN V CSK 31/08 (teza)",
      content:
        "Zastrzeżenie w umowie najmu zawartej na czas oznaczony możliwości jej wypowiedzenia bez określenia przyczyn tego wypowiedzenia, bądź z posłużeniem się ogólną klauzulą 'z ważnych przyczyn' bez ich skonkretyzowania w treści umowy, jest nieważne w świetle art. 673 § 3 k.c. Strony umowy na czas oznaczony muszą w samej umowie precyzyjnie określić sytuacje uprawniające do wypowiedzenia.",
      sourceUrl: "http://www.sn.pl/sites/orzecznictwo/orzeczenia2/v%20csk%2031-08-1.pdf",
      legalStateDate: "2008-06-19",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["najem na czas oznaczony", "art 673 par 3 kc", "ważne przyczyny", "skonkretyzowanie przyczyn"],
    },
    {
      id: "sn-iii-czp-52-19",
      actTitle: "Uchwała Sądu Najwyższego z dnia 12 grudnia 2019 r., sygn. III CZP 52/19",
      editorialUnit: "Uchwała SN III CZP 52/19 (teza)",
      content:
        "Kaucja zabezpieczająca, o której mowa w art. 6 ustawy o ochronie praw lokatorów, służy wyłącznie zaspokojeniu roszczeń przysługujących wynajmującemu z tytułu najmu lokalu w dniu jego opróżnienia. Wynajmujący nie może zatrzymać kaucji na poczet rzekomych szkód lub kar umownych, których istnienia i wysokości nie udowodnił w protokole zdawczo-odbiorczym lub rachunkach.",
      sourceUrl: "http://www.sn.pl/sites/orzecznictwo/orzeczenia3/iii%20czp%2052-19.pdf",
      legalStateDate: "2019-12-12",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny"],
      keywords: ["rozliczenie kaucji", "potrącenia z kaucji", "protokół zdawczo-odbiorczy", "art 6 uopl"],
    },
    {
      id: "tsue-c-229-19",
      actTitle: "Wyrok Trybunału Sprawiedliwości Unii Europejskiej z dnia 27 stycznia 2021 r., sprawa C-229/19 (Dexia)",
      editorialUnit: "Wyrok TSUE C-229/19 (pkt 64-67)",
      content:
        "Artykuł 6 ust. 1 dyrektywy Rady 93/13/EWG z dnia 5 kwietnia 1993 r. w sprawie nieuczciwych warunków w umowach konsumenckich należy interpretować w ten sposób, że sprzeciwia się on temu, aby sąd krajowy, który stwierdza nieuczciwy charakter warunku umowy zawartej między przedsiębiorcą a konsumentem, zastępował ten warunek przepisem prawa krajowego o charakterze dyspozytywnym, o ile konsument nie wyraził na to wyraźnej zgody po poinformowaniu go o konsekwencjach. Warunek nieuczciwy musi zostać uznany za niewiążący konsumenta od początku (ex tunc).",
      sourceUrl: "https://curia.europa.eu/juris/document/document.jsf?text=&docid=237060&pageIndex=0&doclang=PL",
      legalStateDate: "2021-01-27",
      contractTypeTags: ["najem_lokalu_mieszkalnego", "najem_okazjonalny", "konsument"],
      keywords: ["dyrektywa 93/13/EWG", "klauzule abuzywne", "ex tunc", "zakaz redukcji utrzymującej skuteczność"],
    },
  ];

  for (const item of courtEntries) {
    const unit: LegalKbUnit = {
      id: item.id,
      unitType: "court_ruling",
      actTitle: item.actTitle,
      publicationAddress: item.actTitle,
      editorialUnit: item.editorialUnit,
      content: item.content,
      sourceUrl: item.sourceUrl,
      fetchDate: today,
      legalStateDate: item.legalStateDate,
      contentHashSha256: sha256(item.content),
      status: "active",
      contractTypeTags: item.contractTypeTags,
      keywords: item.keywords,
      officialCitation: item.editorialUnit,
    };
    LegalKbUnitSchema.parse(unit);
    fs.writeFileSync(path.join(courtDir, `${item.id}.json`), JSON.stringify(unit, null, 2), "utf8");
    allUnits.push(unit);
    console.log(`Zapisano orzeczenie: ${item.id}`);
  }

  // ============================================================================
  // 5. INDEKS LEGAL-KB (index.json)
  // ============================================================================
  const indexData: LegalKbIndex = {
    version: "2026.10-najem",
    generatedAt: new Date().toISOString(),
    totalUnits: allUnits.length,
    unitsByAct: {
      "Ustawa o ochronie praw lokatorów": uoplArticles.length,
      "Kodeks cywilny": kcArticles.length,
      "Rejestr Klauzul UOKiK": uokikEntries.length,
      "Orzecznictwo SN i TSUE": courtEntries.length,
    },
    unitsByType: {
      statute: uoplArticles.length + kcArticles.length,
      uokik_clause: uokikEntries.length,
      court_ruling: courtEntries.length,
    },
    units: allUnits.map((u) => ({
      id: u.id,
      unitType: u.unitType,
      editorialUnit: u.editorialUnit,
      actTitle: u.actTitle,
      filePath: path.relative(kbRoot, path.join(kbRoot, u.unitType === "statute" ? (u.id.startsWith("uopl") ? "akty/uopl" : "akty/kc") : u.unitType === "uokik_clause" ? "uokik" : "orzecznictwo", `${u.id}.json`)),
      legalStateDate: u.legalStateDate,
      status: u.status,
      contractTypeTags: u.contractTypeTags,
    })),
  };

  fs.writeFileSync(path.join(kbRoot, "index.json"), JSON.stringify(indexData, null, 2), "utf8");
  console.log(`\nIndeks bazy prawnej pomyślnie zaktualizowany. Łącznie jednostek: ${allUnits.length}`);
}

main().catch((err) => {
  console.error("Krytyczny błąd w zasilaniu bazy prawnej:", err);
  process.exit(1);
});
