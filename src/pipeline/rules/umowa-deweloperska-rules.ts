import { SingleClauseEvaluation } from "../schemas/stage06-evaluation";

/**
 * Reguły deterministyczne dla umowy deweloperskiej (szkic, etap 6).
 *
 * Każdy próg liczbowy pochodzi z tekstu jednolitego ustawy deweloperskiej Dz.U. 2026 poz. 880,
 * zapisanego w legal-kb (jednostki `dew-*`). Reguły wykrywają tylko twarde, policzalne naruszenia
 * w brzmieniu zapisu. Nie zastępują oceny prawnika ani modelu językowego.
 */

export interface DeveloperRuleClause {
  id: string;
  fullText: string;
}

/** art. 32 ust. 2 — opłata rezerwacyjna najwyżej 1% ceny z prospektu. */
export const RESERVATION_FEE_MAX_SHARE = 0.01;
/** art. 41 ust. 4 — 14 dni na informację o uznaniu wad albo odmowie. */
export const DEFECT_RESPONSE_MAX_DAYS = 14;
/** art. 41 ust. 6 — 30 dni na usunięcie uznanych wad. */
export const DEFECT_REMOVAL_MAX_DAYS = 30;
/** art. 43 ust. 3 — 120-dniowy termin na przeniesienie praw przed odstąpieniem nabywcy. */
export const BUYER_EXTRA_TERM_DAYS = 120;
/** art. 43 ust. 7 — 30 dni od doręczenia wezwania do zapłaty przed odstąpieniem dewelopera. */
export const DEVELOPER_PAYMENT_NOTICE_MIN_DAYS = 30;

const MONEY_TOLERANCE_PLN = 0.005;
const AMOUNT = String.raw`(\d{1,3}(?:[ \u00a0.]\d{3})+|\d+)(?:,(\d{1,2}))?\s*(?:zł|pln)`;
const DAYS = /(\d+)\s*(?:\([^)]*\)\s*)?dni/gi;

type Finding = Omit<SingleClauseEvaluation, "clauseId">;

function parsePln(integerPart: string, fraction: string | undefined): number {
  const whole = Number(integerPart.replace(/[ \u00a0.]/g, ""));
  return fraction ? whole + Number(`0.${fraction.padEnd(2, "0")}`) : whole;
}

function firstAmount(text: string): number | undefined {
  const m = new RegExp(AMOUNT, "i").exec(text);
  return m ? parsePln(m[1], m[2]) : undefined;
}

function dayCounts(text: string): number[] {
  return [...text.matchAll(DAYS)].map((m) => Number(m[1]));
}

// Nie dzielimy po skrótach typowych dla umów: „art.”, „ust.”, „pkt”, „nr”, „Dz.U.”, „r.”.
const SENTENCE_BREAK = /(?<=(?<!(?:^|[\s(])(?:art|ust|pkt|nr|poz|lit|tj|np|Dz|U|r))[.;])\s+/i;

function sentences(text: string): string[] {
  return text
    .split(SENTENCE_BREAK)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatPln(value: number): string {
  return `${value.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`;
}

/** Cena całkowita: największa kwota w zdaniu o cenie, z pominięciem ceny za metr kwadratowy. */
export function detectTotalPrice(fullText: string): number | undefined {
  const candidates = sentences(fullText)
    .filter((s) => /(?<!\p{L})cen[aęy](?!\p{L})/iu.test(s) && !/(m²|m2|metr|rezerwacyjn)/i.test(s))
    .flatMap((s) => [...s.matchAll(new RegExp(AMOUNT, "gi"))].map((m) => parsePln(m[1], m[2])));
  return candidates.length > 0 ? Math.max(...candidates) : undefined;
}

function reservationFee(sentence: string, totalPrice: number | undefined): Finding | null {
  if (!/opłat[^\s.;,]*\s+rezerwacyjn/i.test(sentence) || totalPrice === undefined) return null;
  const fee = firstAmount(sentence);
  if (fee === undefined) return null;
  const limit = totalPrice * RESERVATION_FEE_MAX_SHARE;
  const excess = fee - limit;
  if (excess <= MONEY_TOLERANCE_PLN) return null;
  return {
    checklistItemId: "dew-oplata-rezerwacyjna",
    ocena: "czerwony",
    tytulPoLudzku: "Opłata rezerwacyjna przekracza 1% ceny",
    doslownyCytatZUmowy: sentence,
    uzasadnienie: `Opłata rezerwacyjna może wynieść najwyżej 1% ceny z prospektu informacyjnego (art. 32 ust. 2). Przy cenie ${formatPln(totalPrice)} to ${formatPln(limit)}, a umowa podaje ${formatPln(fee)}.`,
    zrodlaIds: ["dew-art-32"],
    pewnosc: 0.95,
    kwotaRyzyka: Math.round(excess * 100) / 100,
    zalozeniaKwoty: `Nadwyżka ponad limit: ${formatPln(fee)} − ${formatPln(limit)}. Limit liczony od ceny z umowy; ustawa liczy go od ceny z prospektu, więc sprawdź, czy są równe.`,
    propozycjaZmianyKierunek: `Poproś o obniżenie opłaty rezerwacyjnej do ${formatPln(limit)} albo zwrot nadwyżki.`,
  };
}

function trustAccount(sentence: string): Finding | null {
  const aboutPayment = /(wpłac|wpłat|zapłac|zapłat|płatn|uiści|uiszcz)/i.test(sentence);
  const outsideTrust = /(rachun[^\s.;,]*\s+(bieżąc|bankow[^\s.;,]*\s+dewelopera|firmow|dewelopera)|gotówk|w kasie)/i.test(sentence);
  if (!aboutPayment || !outsideTrust || /powiernicz/i.test(sentence)) return null;
  return {
    checklistItemId: "dew-rachunek-powierniczy",
    ocena: "czerwony",
    tytulPoLudzku: "Wpłaty poza rachunkiem powierniczym",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Deweloper musi zapewnić ci mieszkaniowy rachunek powierniczy, a ty płacisz na ten rachunek (art. 6 ust. 1, art. 8 ust. 1). Ten zapis kieruje wpłaty gdzie indziej, więc nie są chronione tak, jak przewiduje ustawa.",
    zrodlaIds: ["dew-art-6", "dew-art-8"],
    pewnosc: 0.9,
    propozycjaZmianyKierunek: "Poproś, żeby wszystkie wpłaty szły na mieszkaniowy rachunek powierniczy z podanym numerem i bankiem.",
  };
}

function trustAccountCosts(sentence: string): Finding | null {
  const about = /rachun[^\s.;,]*\s+powiernicz/i.test(sentence) && /(koszt|opłat|prowizj)/i.test(sentence);
  const onBuyer = /(nabywc[^\s.;,]*[^.;]{0,40}(ponosi|pokrywa|pokryje|obciąż|zapłaci)|(ponosi|pokrywa|obciążają)\s+nabywc)/i.test(sentence);
  if (!about || !onBuyer) return null;
  const amount = firstAmount(sentence);
  return {
    checklistItemId: "dew-koszty-rachunku-powierniczego",
    ocena: "czerwony",
    tytulPoLudzku: "Koszty rachunku powierniczego po stronie nabywcy",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Koszty, opłaty i prowizje za prowadzenie rachunku powierniczego obciążają dewelopera, a twoich wpłat nie można o nie pomniejszać (art. 14). Zapis mniej korzystny niż ustawa jest nieważny (art. 42).",
    zrodlaIds: ["dew-art-14", "dew-art-42"],
    pewnosc: 0.9,
    kwotaRyzyka: amount,
    zalozeniaKwoty: amount !== undefined ? `Kwota kosztów wskazana w zapisie: ${formatPln(amount)}.` : undefined,
    propozycjaZmianyKierunek: "Poproś o wykreślenie obowiązku pokrywania kosztów rachunku powierniczego.",
  };
}

function buyerWithdrawalCharge(sentence: string, totalPrice: number | undefined): Finding | null {
  const developerWithdraws = /deweloper[^.;]{0,30}(może|ma\s+prawo|jest\s+uprawniony)[^.;]{0,20}odstąp/i.test(sentence);
  const buyerWithdraws = /odstąp/i.test(sentence) && /nabywc/i.test(sentence) && !developerWithdraws;
  const charge = /(nabywc[^\s.;,]*[^.;]{0,40}(zapłaci|traci|ponosi|pokryje|obciąż)|potrąc|zatrzym[^\s.;,]*\s+(część|kwot|opłat|wpłat)|odstępne)/i.test(sentence);
  const explicitlyFree = /(bez\s+potrąceń|nie\s+ponosi\s+(żadnych\s+)?kosztów)/i.test(sentence);
  if (!buyerWithdraws || !charge || explicitlyFree) return null;
  let amount = firstAmount(sentence);
  let assumption = amount !== undefined ? `Kwota wskazana w zapisie: ${formatPln(amount)}.` : undefined;
  const percent = /(\d+(?:,\d+)?)\s*%\s*ceny/i.exec(sentence);
  if (amount === undefined && percent && totalPrice !== undefined) {
    const share = Number(percent[1].replace(",", ".")) / 100;
    amount = Math.round(totalPrice * share * 100) / 100;
    assumption = `${percent[1]}% ceny ${formatPln(totalPrice)} = ${formatPln(amount)}.`;
  }
  return {
    checklistItemId: "dew-odstapienie-nabywcy",
    ocena: "czerwony",
    tytulPoLudzku: "Opłata za odstąpienie od umowy przez nabywcę",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Gdy odstępujesz z powodu wymienionego w art. 43 ust. 1, umowa nie może przewidywać zapłaty za odstąpienie, a ty nie ponosisz żadnych kosztów (art. 44 ust. 1–2). W tym zakresie zapis jest nieważny (art. 42). Prawnik oceni, czy zapis obejmuje też inne sytuacje.",
    zrodlaIds: ["dew-art-44", "dew-art-42"],
    pewnosc: 0.85,
    kwotaRyzyka: amount,
    zalozeniaKwoty: assumption,
    propozycjaZmianyKierunek: "Poproś o dopisanie, że odstąpienie w przypadkach z art. 43 ust. 1 ustawy nie wiąże się z żadną opłatą ani potrąceniem.",
  };
}

function developerWithdrawalNotice(sentence: string): Finding | null {
  if (!/deweloper[^\s.;,]*[^.;]{0,80}odstąp/i.test(sentence) || /nabywc[^\s.;,]*\s+(może\s+)?odstąp/i.test(sentence)) return null;
  const aboutPayment = /(zapłac|zapłat|wpłac|wpłat|płatnoś|świadczeni[^\s.;,]*\s+pieniężn|zaleg)/i.test(sentence);
  if (!aboutPayment) return null;
  const noNotice = /(bez\s+(uprzedniego\s+)?wezwania|ze\s+skutkiem\s+natychmiastowym)/i.test(sentence);
  const shortNotice = /wezw/i.test(sentence) && dayCounts(sentence).some((d) => d < DEVELOPER_PAYMENT_NOTICE_MIN_DAYS);
  if (!noNotice && !shortNotice) return null;
  return {
    checklistItemId: "dew-odstapienie-dewelopera",
    ocena: "czerwony",
    tytulPoLudzku: "Odstąpienie dewelopera bez 30-dniowego wezwania",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Z powodu braku zapłaty deweloper może odstąpić dopiero po pisemnym wezwaniu do zapłaty w terminie 30 dni od doręczenia (art. 43 ust. 7). Krótszy termin jest mniej korzystny niż ustawa, więc w tej części zapis jest nieważny (art. 42).",
    zrodlaIds: ["dew-art-43", "dew-art-42"],
    pewnosc: 0.9,
    propozycjaZmianyKierunek: "Poproś o zapis zgodny z ustawą: odstąpienie tylko po pisemnym wezwaniu do zapłaty w terminie 30 dni od doręczenia.",
  };
}

function buyerExtraTerm(sentence: string): Finding | null {
  const about = /nabywc/i.test(sentence) && /wyznacz/i.test(sentence) && /(przeniesieni|odstąp)/i.test(sentence);
  if (!about || !dayCounts(sentence).some((d) => d > BUYER_EXTRA_TERM_DAYS)) return null;
  return {
    checklistItemId: "dew-termin-przeniesienia-wlasnosci",
    ocena: "czerwony",
    tytulPoLudzku: "Odstąpienie dopiero po terminie dłuższym niż 120 dni",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Gdy deweloper nie przeniesie własności w terminie, wyznaczasz mu 120 dni, a potem możesz odstąpić (art. 43 ust. 3). Dłuższy termin opóźnia twoje prawo odstąpienia, więc w tej części zapis jest nieważny (art. 42).",
    zrodlaIds: ["dew-art-43", "dew-art-42"],
    pewnosc: 0.9,
    propozycjaZmianyKierunek: "Poproś o zastąpienie terminu terminem 120 dni, zgodnie z art. 43 ust. 3 ustawy.",
  };
}

function defectTerms(sentence: string): Finding | null {
  if (!/wad/i.test(sentence)) return null;
  const days = dayCounts(sentence);
  const removal = /usun/i.test(sentence) && days.some((d) => d > DEFECT_REMOVAL_MAX_DAYS);
  const response = /(uzna|ustosunk|odpowie|poinformuje|stanowisk)/i.test(sentence) && !/usun/i.test(sentence) && days.some((d) => d > DEFECT_RESPONSE_MAX_DAYS);
  if (!removal && !response) return null;
  return {
    checklistItemId: "dew-odbior-i-usuwanie-wad",
    ocena: "czerwony",
    tytulPoLudzku: removal ? "Termin usunięcia wad dłuższy niż 30 dni" : "Termin odpowiedzi na zgłoszone wady dłuższy niż 14 dni",
    doslownyCytatZUmowy: sentence,
    uzasadnienie: removal
      ? "Deweloper ma 30 dni od podpisania protokołu na usunięcie uznanych wad (art. 41 ust. 6). Dłuższy termin w umowie jest mniej korzystny niż ustawa, więc w tej części zapis jest nieważny (art. 42)."
      : "Deweloper ma 14 dni od podpisania protokołu, żeby uznać wady albo odmówić z podaniem przyczyn. Jeśli milczy, wady uważa się za uznane (art. 41 ust. 4–5). Dłuższy termin w umowie jest nieważny (art. 42).",
    zrodlaIds: ["dew-art-41", "dew-art-42"],
    pewnosc: 0.9,
    propozycjaZmianyKierunek: removal
      ? "Poproś o termin usunięcia wad 30 dni od podpisania protokołu odbioru."
      : "Poproś o termin 14 dni na odpowiedź dewelopera w sprawie zgłoszonych wad.",
  };
}

function notaryCosts(sentence: string): Finding | null {
  const about = /(notariusz|notarialn|wieczystoksięgow)/i.test(sentence) && /(koszt|wynagrodzeni|taks|opłat)/i.test(sentence);
  const onBuyer = /(nabywc[^\s.;,]*[^.;]{0,40}(ponosi|pokrywa|pokryje|obciąż)|(ponosi|pokrywa|obciążają)\s+(w\s+całości\s+)?nabywc)/i.test(sentence);
  const shared = /(równych\s+częściach|po\s+połowie|po\s+równo)/i.test(sentence);
  const finalDeed = /(przenosząc|przeniesieni[^\s.;,]*\s+własności|umow[^\s.;,]*\s+sprzedaży)/i.test(sentence);
  if (!about || !onBuyer || shared || finalDeed) return null;
  return {
    checklistItemId: "dew-koszty-notarialne",
    ocena: "czerwony",
    tytulPoLudzku: "Koszty notarialne umowy deweloperskiej tylko po twojej stronie",
    doslownyCytatZUmowy: sentence,
    uzasadnienie:
      "Wynagrodzenie notariusza za czynności przy zawieraniu umowy deweloperskiej oraz koszty sądowe wpisu do księgi wieczystej ponoszą po równo deweloper i nabywca (art. 40 ust. 2). Zapis przerzucający całość na ciebie jest nieważny (art. 42).",
    zrodlaIds: ["dew-art-40", "dew-art-42"],
    pewnosc: 0.9,
    propozycjaZmianyKierunek: "Poproś o zapis, że te koszty strony ponoszą w równych częściach.",
  };
}

const NOTARIAL_MARKERS = /(akt[^\s.;,]*\s+notarialn|notariusz|repertorium)/i;
const ORDINARY_FORM = /(zwykłej\s+formie\s+pisemnej|w\s+formie\s+pisemnej|sporządzon[^\s.;,]*\s+w\s+dwóch\s+jednobrzmiących\s+egzemplarzach)/i;

function writtenFormOnly(fullText: string, clauses: DeveloperRuleClause[]): SingleClauseEvaluation | null {
  if (NOTARIAL_MARKERS.test(fullText)) return null;
  for (const clause of clauses) {
    const hit = sentences(clause.fullText).find((s) => /umow/i.test(s) && ORDINARY_FORM.test(s));
    if (!hit) continue;
    return {
      clauseId: clause.id,
      checklistItemId: "dew-forma-aktu-notarialnego",
      ocena: "czerwony",
      tytulPoLudzku: "Umowa deweloperska bez aktu notarialnego",
      doslownyCytatZUmowy: hit,
      uzasadnienie:
        "Umowę deweloperską zawiera się w formie aktu notarialnego (art. 40 ust. 1). Ten dokument przewiduje inną formę i nie wspomina notariusza. Nie podpisuj go jako umowy deweloperskiej.",
      zrodlaIds: ["dew-art-40"],
      pewnosc: 0.9,
      propozycjaZmianyKierunek: "Poproś o zawarcie umowy u notariusza w formie aktu notarialnego.",
    };
  }
  return null;
}

type SentenceRule = (sentence: string, totalPrice: number | undefined) => Finding | null;

const SENTENCE_RULES: readonly SentenceRule[] = [
  reservationFee,
  trustAccount,
  trustAccountCosts,
  buyerWithdrawalCharge,
  developerWithdrawalNotice,
  buyerExtraTerm,
  defectTerms,
  notaryCosts,
];

/**
 * Uruchamia wszystkie reguły na klauzulach umowy. Jedna uwaga na parę (klauzula, punkt checklisty).
 */
export function evaluateDeveloperContract(clauses: DeveloperRuleClause[]): SingleClauseEvaluation[] {
  const fullText = clauses.map((c) => c.fullText).join("\n");
  const totalPrice = detectTotalPrice(fullText);
  const results: SingleClauseEvaluation[] = [];
  const seen = new Set<string>();

  for (const clause of clauses) {
    for (const sentence of sentences(clause.fullText)) {
      for (const rule of SENTENCE_RULES) {
        const finding = rule(sentence, totalPrice);
        if (!finding) continue;
        const key = `${clause.id}:${finding.checklistItemId ?? finding.tytulPoLudzku}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ clauseId: clause.id, ...finding });
      }
    }
  }

  const formFinding = writtenFormOnly(fullText, clauses);
  if (formFinding) results.push(formFinding);
  return results;
}
