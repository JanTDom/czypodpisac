import { SingleClauseEvaluation } from "../schemas/stage06-evaluation";
import { ExtractedClause } from "../schemas/stage03-segmentation";

/**
 * Reguły audytu prawnego dla umowy zlecenia / o świadczenie usług.
 * 
 * Kluczowe obszary:
 * 1. Wykrywanie cech stosunku pracy (art. 22 § 1, 1¹, 1² Kodeksu pracy)
 *    - Godziny pracy / dyspozycyjność
 *    - Miejsce pracy wyznaczone przez zleceniodawcę
 *    - Kierownictwo i podporządkowanie (wykonywanie poleceń przełożonych)
 *    - Obowiązek osobistego świadczenia / zakaz zastępstwa
 *    - Narzędzia i organizacja pracy
 * 2. Asymetria wypowiedzenia zlecenia i rygory rozwiązania (art. 746 Kodeksu cywilnego)
 * 3. Kary umowne za zakaz konkurencji i inne (art. 483-484 k.c. oraz art. 101¹ k.p.)
 * 4. Prawa autorskie do wszelkich utworów w ramach ryczałtu (art. 41 ust. 3 ustawy o prawie autorskim)
 */

interface WorkRelationSignal {
  category: string;
  label: string;
  clauseId: string;
  quote: string;
}

export function evaluateZlecenieContract(
  clauses: readonly ExtractedClause[],
  userRole: string = "wykonawca"
): SingleClauseEvaluation[] {
  const evaluations: SingleClauseEvaluation[] = [];
  const signals: WorkRelationSignal[] = [];

  for (const clause of clauses) {
    const text = clause.fullText;
    const lower = text.toLowerCase();

    // Sygnał 1: Wyznaczone godziny i dni pracy
    if (
      (lower.includes("od poniedziałku do piątku") || lower.includes("godzinach od") || lower.includes("w godzinach") || lower.includes("harmonogram")) &&
      (lower.includes("9.00") || lower.includes("9:00") || lower.includes("17.00") || lower.includes("17:00") || lower.includes("wykonuje czynności od") || lower.includes("czas"))
    ) {
      signals.push({
        category: "czas_pracy",
        label: "Wyznaczone sztywne godziny pracy przez zlecającego",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Sygnał 2: Wyznaczone miejsce pracy (siedziba/redakcja)
    if (
      (lower.includes("podstawowym miejscem") || lower.includes("miejscem wykonywania") || lower.includes("w siedzibie")) &&
      (lower.includes("siedziba") || lower.includes("redakcj") || lower.includes("biur"))
    ) {
      signals.push({
        category: "miejsce_pracy",
        label: "Miejsce wykonywania czynności wyznaczone w siedzibie zlecającego",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Sygnał 3: Kierownictwo, podległość służbowa i polecenia
    if (
      (lower.includes("kierownictw") || lower.includes("poleceń") || lower.includes("przełożon") || lower.includes("redaktora naczelnego") || lower.includes("wydawcy")) &&
      (lower.includes("podlega") || lower.includes("wykonywanie poleceń") || lower.includes("stosować się"))
    ) {
      signals.push({
        category: "kierownictwo",
        label: "Bieżące podporządkowanie i obowiązek wykonywania poleceń przełożonych",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Sygnał 4: Obowiązek osobistego świadczenia i zakaz zastępcy
    if (
      (lower.includes("osobiście") || lower.includes("osobistego wykonywania")) &&
      (lower.includes("powierzenie") || lower.includes("osobie trzeciej") || lower.includes("zastępc"))
    ) {
      signals.push({
        category: "osobiste_swiadczenie",
        label: "Bezwzględny obowiązek osobistego świadczenia bez prawa do swobodnego zastępcy",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Sygnał 5: Stała dyspozycyjność i konieczność zgłaszania/akceptacji nieobecności (urlopy)
    if (
      (lower.includes("dyspozycyjn") || lower.includes("nieobecnoś")) &&
      (lower.includes("wymaga akceptacji") || lower.includes("zgoda na nieobecność") || lower.includes("pełnej dyspozycyjności") || lower.includes("odmówić zgody"))
    ) {
      signals.push({
        category: "dyspozycyjnosc_urlopy",
        label: "Wymóg zgody na nieobecność (pozorny urlop) i wymuszona dyspozycyjność",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Sygnał 6: Sprzęt, procedury i regulaminy organizacyjne
    if (
      (lower.includes("komputer") || lower.includes("telefon") || lower.includes("sprzęt") || lower.includes("system redakcyjn")) &&
      (lower.includes("udostępni") || lower.includes("narzędzia") || lower.includes("instrukcji"))
    ) {
      signals.push({
        category: "narzedzia",
        label: "Praca na narzędziach i w infrastrukturze zlecającego",
        clauseId: clause.id,
        quote: text.slice(0, 160),
      });
    }

    // Odrębny audyt klauzul: Zakaz konkurencji i kary umowne
    if (lower.includes("zakaz konkurencji") || (lower.includes("nie może") && lower.includes("innych mediów"))) {
      const penaltyMatch = text.match(/kar(?:y|a|ę)\s+umown[^\d]{1,60}?([\d\s]+(?:[,\.]\d{2,3})*)\s*(?:zł|pln)/i);
      let penaltyAmount: number | undefined;
      if (penaltyMatch) {
        const raw = penaltyMatch[1].replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
        const p = parseFloat(raw);
        if (!isNaN(p)) penaltyAmount = p;
      }

      evaluations.push({
        clauseId: clause.id,
        checklistItemId: "zl-zakaz-konkurencji",
        ocena: "czerwony",
        tytulPoLudzku: "Nieodpłatny zakaz konkurencji z wysoką karą umowną",
        doslownyCytatZUmowy: penaltyMatch ? penaltyMatch[0] : text.slice(0, 140),
        uzasadnienie:
          "Umowa nakłada bardzo szeroki zakaz konkurencji bez jakiegokolwiek odrębnego odszkodowania za powstrzymywanie się od działalności. Dodatkowo obwarowany jest rażąco wygórowaną karą umowną (art. 483 i 484 § 2 k.c.).",
        zrodlaIds: ["kc-art-483", "kc-art-484"],
        pewnosc: 0.95,
        kwotaRyzyka: penaltyAmount,
        zalozeniaKwoty: penaltyAmount ? `Wysokość kary za naruszenie zakazu konkurencji: ${penaltyAmount} zł.` : undefined,
        propozycjaZmianyKierunek: "Wykreśl zakaz konkurencji lub wprowadź za niego ekwiwalentne comiesięczne odszkodowanie płatne przez Zleceniodawcę.",
      });
    }

    // Odrębny audyt: Kary umowne za poufność
    if (lower.includes("poufnoś") && lower.includes("kar")) {
      const penaltyMatch = text.match(/kar(?:y|a|ę)\s+umown[^\d]{1,60}?([\d\s]+(?:[,\.]\d{2,3})*)\s*(?:zł|pln)/i);
      let penaltyAmount: number | undefined;
      if (penaltyMatch) {
        const raw = penaltyMatch[1].replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
        const p = parseFloat(raw);
        if (!isNaN(p)) penaltyAmount = p;
      }

      evaluations.push({
        clauseId: clause.id,
        checklistItemId: "zl-kara-poufnosc",
        ocena: "czerwony",
        tytulPoLudzku: "Wygórowana kara umowna za naruszenie poufności",
        doslownyCytatZUmowy: penaltyMatch ? penaltyMatch[0] : text.slice(0, 140),
        uzasadnienie:
          "Zastrzeżenie kary umownej w oderwaniu od rzeczywistej szkody i możliwości jej miarkowania narusza zasady współżycia społecznego i stanowi rażąco wygórowaną karę umowną (art. 484 § 2 k.c.).",
        zrodlaIds: ["kc-art-483", "kc-art-484"],
        pewnosc: 0.92,
        kwotaRyzyka: penaltyAmount,
        zalozeniaKwoty: penaltyAmount ? `Wysokość kary za naruszenie poufności: ${penaltyAmount} zł.` : undefined,
        propozycjaZmianyKierunek: "Obniż karę umowną do adekwatnego poziomu (np. 1-miesięcznego wynagrodzenia) i wyłącz możliwość podwójnego dochodzenia odszkodowania.",
      });
    }

    // Odrębny audyt: Asymetryczne natychmiastowe rozwiązanie zlecenia („utrata zaufania”)
    if (
      (lower.includes("rozwiązać umowę") || lower.includes("rozwiązanie")) &&
      (lower.includes("natychmiastow") || lower.includes("w każdym czasie")) &&
      (lower.includes("utraty zaufania") || lower.includes("oczekiwaniom"))
    ) {
      evaluations.push({
        clauseId: clause.id,
        checklistItemId: "zl-rozwiazanie-asymetria",
        ocena: "czerwony",
        tytulPoLudzku: "Asymetryczne natychmiastowe rozwiązanie zlecenia (utrata zaufania)",
        doslownyCytatZUmowy: text.slice(0, 140),
        uzasadnienie:
          "Zgodnie z art. 746 § 1 i 2 k.c. wypowiedzenie zlecenia ze skutkiem natychmiastowym bez ważnego powodu rodzi obowiązek naprawienia szkody. Klauzula przyznaje zlecającemu prawo do natychmiastowego zerwania kontraktu pod subiektywnym pretekstem 'utraty zaufania' lub braku spełnienia oczekiwań, przy jednoczesnym zobowiązaniu zleceniobiorcy do 30-dniowego okresu wypowiedzenia.",
        zrodlaIds: ["kc-art-746"],
        pewnosc: 0.92,
        propozycjaZmianyKierunek: "Wprowadź symetryczne okresy wypowiedzenia dla obu stron lub jednoznacznie sprecyzuj obiektywne, rażące naruszenia umowy jako ważne powody.",
      });
    }

    // Odrębny audyt: Prawa autorskie – przeniesienie bez dodatkowego wynagrodzenia do wszelkich przyszłych utworów
    if (
      (lower.includes("autorskich praw") || lower.includes("praw autorskich")) &&
      (lower.includes("bez dodatkowego wynagrodzenia") || lower.includes("w ramach jednego ryczałtu") || lower.includes("każdego materiału"))
    ) {
      evaluations.push({
        clauseId: clause.id,
        checklistItemId: "zl-prawa-autorskie",
        ocena: "żółty",
        tytulPoLudzku: "Przeniesienie praw autorskich do wszelkich utworów w ramach ryczałtu",
        doslownyCytatZUmowy: text.slice(0, 140),
        uzasadnienie:
          "Zgodnie z art. 41 ust. 3 ustawy o prawie autorskim nieważna jest umowa w części dotyczącej wszystkich utworów lub wszystkich utworów określonego rodzaju tego samego twórcy mających powstać w przyszłości. Przeniesienie praw powinno precyzować konkretne dzieła i pola eksploatacji.",
        zrodlaIds: ["praut-art-41"],
        pewnosc: 0.88,
        propozycjaZmianyKierunek: "Wprowadź wymóg akceptacji i protokołu przekazania praw do konkretnie wymienionych utworów lub licencję niewyłączną.",
      });
    }
  }

  // AGREGACJA SYGNAŁÓW STOSUNKU PRACY (Art. 22 Kodeksu pracy)
  if (signals.length >= 2) {
    const isHeavy = signals.length >= 3 || signals.some(s => s.category === "kierownictwo");
    const firstSignal = signals[0];
    const quotesList = signals.map(s => `• ${s.label}: „${s.quote.trim()}”`).join("\n");

    evaluations.unshift({
      clauseId: firstSignal.clauseId,
      checklistItemId: "zl-cechy-stosunku-pracy",
      ocena: isHeavy ? "czerwony" : "żółty",
      tytulPoLudzku: "Umowa zlecenia zawiera kluczowe cechy umowy o pracę (art. 22 k.p.)",
      doslownyCytatZUmowy: firstSignal.quote,
      uzasadnienie:
        `Wykryto ${signals.length} istotnych elementów podporządkowania pracowniczego: wyznaczone godziny i miejsce pracy, bieżące polecenia przełożonych, konieczność uzyskiwania zgody na nieobecności oraz osobiste świadczenie. Zgodnie z art. 22 § 1¹ i § 1² Kodeksu pracy zatrudnienie w takich warunkach jest stosunkiem pracy bez względu na nazwę umowy, a zastępowanie umowy o pracę umową cywilnoprawną jest prawnie zakazane.\n\nSygnały wykryte w umowie:\n${quotesList}`,
      zrodlaIds: ["kp-art-22"],
      pewnosc: 0.98,
      propozycjaZmianyKierunek:
        "Jeśli praca ma być zleceniem, usuń sztywne godziny, dyspozycyjność i polecenia kierownicze. Jeżeli warunki te są konieczne, powinieneś podpisać umowę o pracę zapewniającą urlop, płatne nadgodziny i ochronę przed zwolnieniem.",
    });
  }

  return evaluations;
}
