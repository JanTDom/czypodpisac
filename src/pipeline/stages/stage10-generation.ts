import { AggregatedReport } from "../schemas/stage09-aggregation";
import { SegmentationOutput } from "../schemas/stage03-segmentation";
import {
  ClauseAmendmentProposal,
  GenerationOutput,
  NegotiationEmailDraft,
} from "../schemas/stage10-generation";

/**
 * Baza sprawdzonych szablonów poprawek (zatwierdzone formuły prawne).
 */
interface AmendmentTemplate {
  patternKeyword: string;
  generateSoft: (original: string) => string;
  generateFirm: (original: string) => string;
  legalRationale: string;
}

const AMENDMENT_TEMPLATES: Record<string, AmendmentTemplate> = {
  kaucja: {
    patternKeyword: "kaucj",
    generateSoft: (_orig) =>
      "Wysokość kaucji zabezpieczającej ustala się na kwotę równą 1-miesięcznemu czynszowi najmu. Kaucja podlega zwrotowi w terminie 14 dni od dnia opróżnienia lokalu po potrąceniu ewentualnych bezspornych należności.",
    generateFirm: (_orig) =>
      "Kaucja zabezpieczająca wynosi równowartość jednomiesięcznego czynszu najmu i nie może przekraczać limitów określonych w art. 6 ust. 1 ustawy o ochronie praw lokatorów. Podlega zwrotowi w całości w terminie 14 dni od zwrotu lokalu.",
    legalRationale:
      "Zgodnie z art. 6 ust. 1 ustawy o ochronie praw lokatorów kaucja nie może przekraczać 12-krotności miesięcznego czynszu.",
  },
  kara_wypowiedzenie: {
    patternKeyword: "kara",
    generateSoft: (_orig) =>
      "Każda ze stron ma prawo wypowiedzieć umowę z zachowaniem miesięcznego okresu wypowiedzenia z ważnych przyczyn określonych w umowie, bez obowiązku uiszczania kar umownych lub odstępnego.",
    generateFirm: (_orig) =>
      "Strony wykreślają zapis o karze umownej za rozwiązanie umowy. Wypowiedzenie umowy przez którąkolwiek ze stron na warunkach w niej określonych nie wiąże się z obowiązkiem zapłaty kary umownej ani odstępnego.",
    legalRationale:
      "Art. 385³ pkt 16 i 17 k.c. wymienia, jako niedozwolone w razie wątpliwości, zapisy nakładające tylko na konsumenta zapłatę ustalonej sumy za rezygnację z umowy albo rażąco wygórowaną karę umowną lub odstępne. Taki zapis nie wiąże konsumenta (art. 385¹ § 1 k.c.).",
  },
  jednostronna_zmiana: {
    patternKeyword: "jednostronn",
    generateSoft: (_orig) =>
      "Wszelkie zmiany niniejszej umowy wymagają porozumienia obu stron i sporządzenia aneksu w formie pisemnej pod rygorem nieważności.",
    generateFirm: (_orig) =>
      "Wykreśla się uprawnienie do jednostronnej modyfikacji umowy. Wszelkie zmiany umowy wymagają zgody obu stron wyrażonej w formie pisemnego aneksu pod rygorem nieważności.",
    legalRationale:
      "Art. 385³ pkt 19 i 20 k.c. wymienia, jako niedozwolone w razie wątpliwości, zapisy dające tylko drugiej stronie prawo do zmiany istotnych cech świadczenia bez ważnych przyczyn albo do podwyższenia ceny bez prawa odstąpienia dla konsumenta. Taki zapis nie wiąże konsumenta (art. 385¹ § 1 k.c.).",
  },
};

/**
 * Etap 10: Generowanie poprawek, DOCX/PDF i maila negocjacyjnego
 * Zgodnie ze skillem poprawki-i-mail:
 * - Przygotowuje wersję uprzejmą (partnerską) i stanowczą (z podstawą prawną).
 * - Tworzy uporządkowaną listę zmian z numerami paragrafów.
 * - Generuje link mailto gotowy do wysyłki w programie pocztowym.
 */
export async function executeGeneration(
  report: AggregatedReport,
  segmentation: SegmentationOutput
): Promise<GenerationOutput> {
  const amendments: ClauseAmendmentProposal[] = [];
  const bulletPoints: string[] = [];

  const findingsToAmend = [...report.findings.red, ...report.findings.yellow];

  for (const finding of findingsToAmend) {
    const clause = segmentation.clauses.find((c) => c.id === finding.clauseId);
    const clauseNumber = clause ? clause.clauseNumber : "Wskazany zapis umowy";
    const originalText = finding.doslownyCytatZUmowy || (clause ? clause.fullText : "");

    // Dopasowanie szablonu poprawki
    let matchedTemplate: AmendmentTemplate | undefined;
    const lowerText = `${finding.tytulPoLudzku} ${originalText}`.toLowerCase();

    if (lowerText.includes("kaucj")) {
      matchedTemplate = AMENDMENT_TEMPLATES.kaucja;
    } else if (lowerText.includes("kar") || lowerText.includes("wypowiedzen")) {
      matchedTemplate = AMENDMENT_TEMPLATES.kara_wypowiedzenie;
    } else if (lowerText.includes("jednostronn") || lowerText.includes("zmian")) {
      matchedTemplate = AMENDMENT_TEMPLATES.jednostronna_zmiana;
    }

    const softReplacement = matchedTemplate
      ? matchedTemplate.generateSoft(originalText)
      : `Strony uzgadniają zmianę zapisu ${clauseNumber}: proponujemy wykreślenie lub złagodzenie postanowienia, aby zapewnić symetrię praw i obowiązków obu stron.`;

    const firmReplacement = matchedTemplate
      ? matchedTemplate.generateFirm(originalText)
      : `Postanowienie ${clauseNumber} w obecnym brzmieniu narusza równowagę stron i przepisy Kodeksu cywilnego. Wymagane jest zastąpienie go zapisem zgodnym z prawem lub jego całkowite wykreślenie.`;

    const legalRationale = matchedTemplate
      ? matchedTemplate.legalRationale
      : finding.uzasadnienie || "Postanowienie wymaga modyfikacji w celu ochrony uzasadnionych praw strony.";

    amendments.push({
      findingId: finding.id,
      clauseNumber,
      originalText,
      softReplacementText: softReplacement,
      firmReplacementText: firmReplacement,
      legalRationale,
      isApprovedTemplate: !!matchedTemplate,
      needsLawyerVerification: !matchedTemplate,
    });

    bulletPoints.push(`${clauseNumber}: ${finding.tytulPoLudzku}`);
  }

  // Przygotowanie szkicu maila negocjacyjnego
  const recipientRole = report.contractType.includes("najem") ? "Wynajmujący" : "Druga strona umowy";
  const subject = `Uwagi i propozycje modyfikacji do projektu umowy (${report.contractType.replace(/_/g, " ")})`;

  const bulletListText =
    bulletPoints.length > 0
      ? bulletPoints.map((bp) => `- ${bp}`).join("\n")
      : "- Doprecyzowanie standardowych terminów i procedury odbioru.";

  const bodySoft = `Dzień dobry,

Dziękuję za przesłanie projektu umowy. Zapoznałem się z dokumentem i zasadniczo akceptuję jego główne założenia.

W trosce o dobrą i bezpieczną współpracę chciałbym zaproponować drobne doprecyzowanie kilku postanowień:
${bulletListText}

Szczegółowe propozycje zmian przygotowałem w załączonym dokumencie w trybie śledzenia zmian. Czy moglibyśmy nanieść te korekty przed podpisaniem?

Z poważaniem,`;

  const bodyFirm = `Dzień dobry,

W nawiązaniu do przesłanego projektu umowy, po analizie formalno-prawnej zwracam uwagę na konieczność modyfikacji następujących postanowień:
${bulletListText}

W obecnym brzmieniu tych zapisów nie mogę zaakceptować. Część z nich może być niedozwolona w umowie z konsumentem (art. 385¹ i 385³ Kodeksu cywilnego), a pozostałe są dla mnie wyraźnie niekorzystne.

W załączeniu przesyłam projekt z naniesionymi poprawkami prawnymi w trybie rejestracji zmian. Proszę o informację o akceptacji powyższych zmian.

Z poważaniem,`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodySoft)}`;

  const negotiationEmail: NegotiationEmailDraft = {
    recipientRole,
    subject,
    bodySoft,
    bodyFirm,
    bulletPointsList: bulletPoints.length > 0 ? bulletPoints : ["Weryfikacja projektu umowy"],
    mailtoUrl,
  };

  return {
    analysisId: report.analysisId,
    amendments,
    negotiationEmail,
    exportCapabilities: {
      supportsDocxTrackChanges: true,
      supportsNativePrintPdf: true,
    },
    generatedAt: new Date().toISOString(),
  };
}
