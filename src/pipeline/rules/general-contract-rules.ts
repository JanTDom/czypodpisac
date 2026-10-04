import { SingleClauseEvaluation } from "../schemas/stage06-evaluation";
import { LegalKnowledgeBase } from "../../kb";

/**
 * Uniwersalne reguły bezpieczeństwa prawnego dla KAŻDEJ umowy.
 * Uruchamiane niezależnie od typu dokumentu (zlecenie, b2b, dzieło, sprzedaż, najem, umowa nietypowa).
 * Wszystkie wyjaśnienia pisane są zrozumiałym dla laika językiem — z perspektywy praktycznych skutków życiowych.
 */
export function evaluateGeneralContractRules(
  contractText: string,
  userRole?: string,
  kb?: LegalKnowledgeBase
): SingleClauseEvaluation[] {
  const findings: SingleClauseEvaluation[] = [];

  // 1. Zrzeczenie się prawa do wypowiedzenia z ważnych przyczyn / brak możliwości rozwiązania
  const noTerminationRegex =
    /(wyłącz|zrzeka się|nie przysługuje|brak prawa)[\s\S]{1,60}(wypowiedzeni|rozwiązani)|(nie może|zakaz)[\s\S]{1,40}(wypowiedzieć|rozwiązać)[\s\S]{1,60}(w żadnym|jakimkolwiek|przez okres)/iu;
  const noTerminationMatch = contractText.match(noTerminationRegex);

  if (noTerminationMatch) {
    findings.push({
      clauseId: "general-no-termination",
      checklistItemId: "ogolne-brak-wypowiedzenia",
      ocena: "czerwony",
      tytulPoLudzku: "Zapis odbiera Ci prawo do rozwiązania umowy w krytycznej sytuacji",
      doslownyCytatZUmowy: noTerminationMatch[0].trim().slice(0, 200),
      uzasadnienie:
        "Dla laika: Ta umowa próbuje zamknąć Ci drogę wyjścia. Gdyby druga strona przestała płacić, rażąco łamała ustalenia albo wydarzyło się coś nieprzewidzianego (np. choroba), ten zapis miałby Cię uwięzić w umowie. " +
        "Co mówi prawo: Zgodnie z polskim prawem (m.in. art. 746 § 3 k.c. oraz zasadami słuszności) nie można z góry zrzec się uprawnienia do rozwiązania umowy z ważnych powodów. Taki zakaz jest prawnie bezskuteczny.",
      zrodlaIds: ["kc-art-746"],
      pewnosc: 0.95,
    });
  }

  // 2. Kary umowne bez limitu (narastające w nieskończoność za każdy dzień)
  const infiniteDailyPenaltyRegex =
    /(kara|karę|kary)[\s\S]{1,40}(za każdy|za jeden)[\s\S]{1,30}(dzień|godzinę|doba|zwłoki|opóźnienia)[\s\S]{1,80}(zł|złotych|%|promil)/iu;
  const hasCapRegex = /(maksymalnie|nie więcej niż|do łącznej|łączna wysokość nie może przekroczyć|limit)/iu;

  const penaltyMatch = contractText.match(infiniteDailyPenaltyRegex);
  if (penaltyMatch && !hasCapRegex.test(contractText)) {
    findings.push({
      clauseId: "general-infinite-penalty",
      checklistItemId: "ogolne-kara-bez-limitu",
      ocena: "czerwony",
      tytulPoLudzku: "Kary za każdy dzień opóźnienia nie mają żadnego górnego limitu",
      doslownyCytatZUmowy: penaltyMatch[0].trim().slice(0, 200),
      uzasadnienie:
        "Dla laika: Zastrzeżono karę liczoną za każdy dzień, ale nie wpisano, do jakiej maksymalnej kwoty może ona urosnąć. " +
        "Jeśli z jakiegoś powodu sprawa przeciągnie się o miesiąc lub dwa, druga strona może wystawić Ci rachunek na kwotę przewyższającą całe Twoje wynagrodzenie. " +
        "Co zrobić: Bezwzględnie zażądaj wpisania limitu, np. 'łącznie nie więcej niż 10% lub 20% wartości zamówienia'.",
      zrodlaIds: ["kc-art-483", "kc-art-484"],
      pewnosc: 0.9,
    });
  }

  // 3. Rażąco wygórowana kwotowa kara umowna (powyżej 15 000 zł za błahe lub niemierzalne naruszenia)
  const hugePenaltyRegex =
    /(karę umowną|kary umownej|kara umowna)[\s\S]{1,50}(wysokości|kwocie)\s*([\d\s.]+)\s*(zł|złotych|pln)/iu;
  const hugeMatch = contractText.match(hugePenaltyRegex);

  if (hugeMatch) {
    const rawDigits = hugeMatch[3].replace(/[\s.]/g, "");
    const amount = parseInt(rawDigits, 10);
    if (!isNaN(amount) && amount >= 15000) {
      // Sprawdź czy to nie zostało już zgłoszone przez regułę zlecenia/deweloperskiej
      const isAlreadyCaught = findings.some((f) => f.kwotaRyzyka === amount);
      if (!isAlreadyCaught) {
        findings.push({
          clauseId: "general-huge-penalty",
          checklistItemId: "ogolne-wygorowana-kara",
          ocena: "czerwony",
          tytulPoLudzku: `Drakońska kara umowna w wysokości ${amount.toLocaleString("pl-PL")} zł`,
          doslownyCytatZUmowy: hugeMatch[0].trim().slice(0, 200),
          uzasadnienie:
            `Dla laika: Druga strona wpisała karę w wysokości aż ${amount.toLocaleString("pl-PL")} zł. ` +
            "W polskim prawie kara umowna ma naprawiać realną szkodę, a nie służyć do zarabiania na Twoim potknięciu i doprowadzania Cię do bankructwa. " +
            "Zgodnie z art. 484 § 2 k.c. kara rażąco wygórowana może zostać obniżona przez sąd (tzw. miarkowanie kary), ale bezpieczniej jest obniżyć ją w umowie już teraz.",
          zrodlaIds: ["kc-art-483", "kc-art-484"],
          pewnosc: 0.92,
          kwotaRyzyka: amount,
          zalozeniaKwoty: `Bezpośrednie ryzyko kary wpisanej w umowie: ${amount} zł.`,
        });
      }
    }
  }

  // 4. Przeniesienie praw autorskich do wszystkich utworów przyszłych (art. 41 ust. 3 pr. aut.)
  const futureWorksCopyrightRegex =
    /(wszystki[eich]|wszelki[eich])[\s\S]{1,40}(utwor|utworów|materiał|materiałów)[\s\S]{1,40}(przyszł|mających powstać|stworzon[\p{L}]+ w przyszłości)/iu;
  const futureMatch = contractText.match(futureWorksCopyrightRegex);

  if (futureMatch) {
    findings.push({
      clauseId: "general-future-copyright",
      checklistItemId: "ogolne-prawa-przyszle",
      ocena: "czerwony",
      tytulPoLudzku: "Nieważny z mocy prawa zapis o oddaniu praw do wszystkich przyszłych utworów",
      doslownyCytatZUmowy: futureMatch[0].trim().slice(0, 200),
      uzasadnienie:
        "Dla laika: Druga strona próbuje przejąć prawa do wszystkiego, co stworzysz w przyszłości. " +
        "Co mówi prawo: Taki zapis jest z mocy samego prawa bezwzględnie nieważny! Zgodnie z art. 41 ust. 3 ustawy o prawie autorskim nieważna jest umowa w części dotyczącej wszystkich utworów mających powstać w przyszłości. " +
        "Prawa można przenieść tylko do konkretnych dzieł stworzonych w ramach tej konkretnej umowy.",
      zrodlaIds: ["praut-art-41"],
      pewnosc: 0.96,
    });
  }

  // 5. Jednostronna zmiana umowy bez możliwości sprzeciwu
  const unilateralChangeRegex =
    /(zastrzega sobie prawo|ma prawo|uprawnion[\p{L}]+)[\s\S]{1,40}(jednostronn|samodzieln)[\s\S]{1,40}(zmian|modyfikacj|aktualizacj)[\s\S]{1,40}(umow|regulamin|cennik|warunk)/iu;
  const unilateralMatch = contractText.match(unilateralChangeRegex);

  if (unilateralMatch) {
    findings.push({
      clauseId: "general-unilateral-change",
      checklistItemId: "ogolne-jednostronna-zmiana",
      ocena: "żółty",
      tytulPoLudzku: "Druga strona daje sobie prawo do jednostronnej zmiany warunków lub cennika",
      doslownyCytatZUmowy: unilateralMatch[0].trim().slice(0, 200),
      uzasadnienie:
        "Dla laika: Druga strona wpisała sobie prawo do zmiany reguł gry (np. regulaminu, zakresu lub cennika) w trakcie trwania umowy, bez Twojego podpisu. " +
        "Co zrobić: Każda zmiana umowy powinna wymagać obustronnego aneksu, a jeśli dotyczy regulaminu – musi dawać Ci prawo do natychmiastowego odejścia z umowy bez żadnych kar, jeśli nowe warunki Ci nie odpowiadają.",
      zrodlaIds: ["kc-art-385-1"],
      pewnosc: 0.88,
    });
  }

  return findings;
}
