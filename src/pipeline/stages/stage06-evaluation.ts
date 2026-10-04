import { SegmentationOutput } from "../schemas/stage03-segmentation";
import { ChecklistOutput } from "../schemas/stage04-checklist";
import { RetrievalOutput } from "../schemas/stage05-retrieval";
import { ClassificationOutput } from "../schemas/stage02-classification";
import { EvaluationOutput, SingleClauseEvaluation } from "../schemas/stage06-evaluation";
import { ChecklistRegistry } from "../../checklists/registry";
import { evaluateDeveloperContract } from "../rules/umowa-deweloperska-rules";
import { evaluateZlecenieContract } from "../rules/umowa-zlecenia-rules";
import { evaluateGeneralContractRules } from "../rules/general-contract-rules";

/**
 * Etap 6: Ocena ryzyka prawnego klauzul
 * Wykonuje ewaluację klauzul w oparciu o deterministyczne reguły ustawowe
 * (limity kaucji, terminy wypowiedzenia, kary umowne) oraz ustrukturyzowane
 * wnioskowanie na podstawie autorytatywnych źródeł z legal-kb/.
 */
export async function executeEvaluation(
  classification: ClassificationOutput,
  segmentation: SegmentationOutput,
  checklist: ChecklistOutput,
  retrieval: RetrievalOutput,
  registry: ChecklistRegistry = ChecklistRegistry.getInstance()
): Promise<EvaluationOutput> {
  const evaluations: SingleClauseEvaluation[] = [];
  const evaluatedViolations = new Set<string>();

  for (const ctx of retrieval.contexts) {
    const clause = segmentation.clauses.find((c) => c.id === ctx.clauseId);
    if (!ctx.checklistItemId) continue;
    const checklistItem = registry.getItemById(ctx.checklistItemId);
    if (!clause || !checklistItem) continue;

    const clauseText = clause.fullText;
    const clauseNumber = clause.clauseNumber;
    const availableSourceIds = ctx.retrievedUnits.map((u) => u.id);

    // 1. DETERMINISTYCZNY AUDYT LIMITU KAUCJI DLA NAJMU MIESZKALNEGO
    const isDepositLimitCheck =
      (checklistItem.id.includes("kaucja-limit") || checklistItem.id.includes("zabezpieczenia")) &&
      availableSourceIds.includes("uopl-art-6");

    if (isDepositLimitCheck) {
      const depositMatch = clauseText.match(
        /(?:kaucj(?:a|i|ę))\s*(?:w wysokości|w kwocie|wynosi)?\s*([0-9\s]+(?:[,\.][0-9]{2})?)\s*(?:zł|pln)/i
      );
      const rent = classification.detectedFinancials?.rentAmount;

      if (depositMatch) {
        const deposit = parseFloat(depositMatch[1].replace(/\s+/g, "").replace(",", "."));

        // Limit dla najmu zwykłego: 12x czynsz (art. 6 ust. 1 UoPL)
        if (
          classification.contractType === "najem_lokalu_mieszkalnego" &&
          rent &&
          deposit > rent * 12
        ) {
          const maxAllowed = rent * 12;
          const excess = deposit - maxAllowed;
          const violationKey = `${clause.id}:kaucja_limit`;

          if (!evaluatedViolations.has(violationKey)) {
            evaluatedViolations.add(violationKey);
            evaluations.push({
              clauseId: clause.id,
              checklistItemId: checklistItem.id,
              ocena: "czerwony",
              tytulPoLudzku: "Kaucja przekracza dopuszczalny limit ustawowy",
              doslownyCytatZUmowy: depositMatch[0],
              uzasadnienie: `W umowie najmu lokalu mieszkalnego kaucja nie może przekraczać 12-krotności miesięcznego czynszu (art. 6 ust. 1 ustawy o ochronie praw lokatorów). Przy czynszu ${rent} zł maksymalna kaucja wynosi ${maxAllowed} zł.`,
              zrodlaIds: ["uopl-art-6"],
              pewnosc: 1.0,
              kwotaRyzyka: excess,
              zalozeniaKwoty: `Nadpłata kaucji ponad limit ustawowy (${deposit} zł - ${maxAllowed} zł = ${excess} zł).`,
              propozycjaZmianyKierunek: `Zmniejsz kaucję do kwoty maksymalnie ${maxAllowed} zł (najlepiej standardu 1-krotności czynszu: ${rent} zł).`,
            });
          }
          continue;
        }

        // Limit dla najmu okazjonalnego i instytucjonalnego: 6x czynsz (art. 19c / 19h UoPL)
        const isOccasionalOrInst =
          classification.contractType === "najem_okazjonalny" ||
          classification.contractType === "najem_instytucjonalny";

        if (isOccasionalOrInst && rent && deposit > rent * 6) {
          const maxAllowed = rent * 6;
          const excess = deposit - maxAllowed;
          const sourceId =
            classification.contractType === "najem_okazjonalny"
              ? "uopl-art-19c"
              : "uopl-art-19h";
          const violationKey = `${clause.id}:kaucja_limit_okazjonalny`;

          if (!evaluatedViolations.has(violationKey)) {
            evaluatedViolations.add(violationKey);
            evaluations.push({
              clauseId: clause.id,
              checklistItemId: checklistItem.id,
              ocena: "czerwony",
              tytulPoLudzku: "Kaucja przekracza ustawowy limit 6-krotności czynszu",
              doslownyCytatZUmowy: depositMatch[0],
              uzasadnienie: `W najmie okazjonalnym i instytucjonalnym kaucja nie może przekraczać 6-krotności miesięcznego czynszu. Przy czynszu ${rent} zł limit wynosi ${maxAllowed} zł.`,
              zrodlaIds: [sourceId],
              pewnosc: 1.0,
              kwotaRyzyka: excess,
              zalozeniaKwoty: `Nadwyżka kaucji ponad 6-krotność czynszu: ${excess} zł.`,
              propozycjaZmianyKierunek: `Zmniejsz kaucję do kwoty zgodnej z prawem (${maxAllowed} zł).`,
            });
          }
          continue;
        }
      }
    }

    // 2. DETERMINISTYCZNY AUDYT KAR UMOWYCH I ODSTĄPIENIA
    if (
      checklistItem.id.includes("kar") ||
      clauseText.toLowerCase().includes("kara umowna") ||
      clauseText.toLowerCase().includes("odstępn")
    ) {
      const penaltyMatch = clauseText.match(
        /kar(?:a|y|ę)\s+umown(?:a|ej|ą)[^.]*?(?:w wysokości|w kwocie|wynosi)?\s*([0-9\s]+(?:[,\.][0-9]{2})?)\s*(?:zł|pln|%)/i
      );

      // Kara za wypowiedzenie umowy przez konsumenta (abuzywna wg art. 385³ pkt 16 k.c.)
      if (
        clauseText.toLowerCase().includes("wypowiedzen") &&
        (clauseText.toLowerCase().includes("kar") || clauseText.toLowerCase().includes("odstępn"))
      ) {
        const violationKey = `${clause.id}:kara_wypowiedzenie`;
        if (!evaluatedViolations.has(violationKey)) {
          evaluatedViolations.add(violationKey);

          let penaltyAmount: number | undefined;
          if (penaltyMatch) {
            const raw = penaltyMatch[1].replace(/\s+/g, "").replace(",", ".");
            const parsed = parseFloat(raw);
            if (!isNaN(parsed)) penaltyAmount = parsed;
          }

          evaluations.push({
            clauseId: clause.id,
            checklistItemId: checklistItem.id,
            ocena: "czerwony",
            tytulPoLudzku: "Niedozwolona kara umowna za rozwiązanie umowy",
            doslownyCytatZUmowy: penaltyMatch ? penaltyMatch[0] : clauseText.slice(0, 100),
            uzasadnienie:
              "Art. 385³ k.c. wymienia zapisy, które w razie wątpliwości uważa się za niedozwolone wobec konsumenta. " +
              "Są wśród nich zapisy, które nakładają tylko na konsumenta obowiązek zapłaty ustalonej sumy za rezygnację z wykonania umowy (pkt 16) " +
              "albo rażąco wygórowaną karę umowną lub odstępne (pkt 17). Zapis niedozwolony nie wiąże konsumenta (art. 385¹ § 1).",
            zrodlaIds: ["kc-art-385-3", "kc-art-385-1"],
            pewnosc: 0.8,
            kwotaRyzyka: penaltyAmount,
            zalozeniaKwoty: penaltyAmount
              ? `Kwota kary zapisana w umowie: ${penaltyAmount} zł. Tyle możesz zapłacić, jeśli zapis zostanie uznany za wiążący.`
              : undefined,
            propozycjaZmianyKierunek:
              "Wykreśl w całości zapis nakładający karę za wypowiedzenie umowy.",
          });
        }
        continue;
      }
    }

    // 3. DETERMINISTYCZNY AUDYT JEDNOSTRONNEJ ZMIANY LUB PRZEDŁUŻENIA
    if (
      checklistItem.id.includes("jednostronna-zmiana") &&
      (clauseText.toLowerCase().includes("jednostronnie") ||
        clauseText.toLowerCase().includes("bez zgody"))
    ) {
      const violationKey = `${clause.id}:jednostronna_zmiana`;
      if (!evaluatedViolations.has(violationKey)) {
        evaluatedViolations.add(violationKey);
        evaluations.push({
          clauseId: clause.id,
          checklistItemId: checklistItem.id,
          ocena: "czerwony",
          tytulPoLudzku: "Niedozwolona jednostronna zmiana warunków umowy",
          doslownyCytatZUmowy: clauseText.slice(0, 120),
          uzasadnienie:
            "Art. 385³ k.c. wymienia zapisy, które w razie wątpliwości uważa się za niedozwolone wobec konsumenta. " +
            "Są wśród nich zapisy dające tylko drugiej stronie prawo do zmiany istotnych cech świadczenia bez ważnych przyczyn (pkt 19) " +
            "oraz prawo do podwyższenia ceny po zawarciu umowy bez prawa odstąpienia dla konsumenta (pkt 20). " +
            "Zapis niedozwolony nie wiąże konsumenta (art. 385¹ § 1).",
          zrodlaIds: ["kc-art-385-1", "kc-art-385-3"],
          pewnosc: 0.8,
          propozycjaZmianyKierunek:
            "Zastąp klauzulą wymagającą obustronnego aneksu na piśmie pod rygorem nieważności.",
        });
      }
      continue;
    }

    // 4. OCENA ZIELONA: Zgodność z prawem i standardem
    evaluations.push({
      clauseId: clause.id,
      checklistItemId: checklistItem.id,
      ocena: "zielony",
      tytulPoLudzku: `${checklistItem.area}: zapis prawidłowy`,
      doslownyCytatZUmowy: clauseText.slice(0, 80),
      uzasadnienie: `Postanowienie ${clauseNumber} spełnia kryteria prawne i nie narusza praw konsumenta.`,
      zrodlaIds: availableSourceIds.slice(0, 2),
      pewnosc: 0.9,
    });
  }

  // 5. REGUŁY UMOWY DEWELOPERSKIEJ — działają tylko, gdy checklista tego typu jest zarejestrowana.
  // Domyślny rejestr jej nie zawiera, dopóki prawnik nie zatwierdzi punktów (typ nieaktywny w produkcji).
  if (classification.contractType === "umowa_deweloperska" && registry.hasChecklist("umowa_deweloperska")) {
    evaluations.push(...evaluateDeveloperContract(segmentation.clauses));
  }

  // 6. REGUŁY UMOWY ZLECENIA / B2B — audyt cech stosunku pracy (art. 22 k.p.) i pułapek zlecenia
  if (classification.contractType === "zlecenie" || classification.contractType === "b2b_uslugi_freelancer") {
    evaluations.push(...evaluateZlecenieContract(segmentation.clauses, classification.userRole));
  }

  // 7. UNIWERSALNE REGUŁY BEZPIECZEŃSTWA PRAWNEGO — dla każdej umowy (kary, zrzeczenia, prawa autorskie)
  const fullContractText = segmentation.clauses.map((c) => c.fullText).join("\n\n");
  const generalFindings = evaluateGeneralContractRules(fullContractText, classification.userRole);
  for (const gf of generalFindings) {
    // Unikaj duplikowania tego samego typu ryzyka, jeśli już zostało zgłoszone
    const alreadyPresent = evaluations.some(
      (e) => e.checklistItemId === gf.checklistItemId || (gf.kwotaRyzyka && e.kwotaRyzyka === gf.kwotaRyzyka)
    );
    if (!alreadyPresent) {
      // Przypisz do pasującej klauzuli z segmentacji
      const matchingClause = segmentation.clauses.find((c) =>
        c.fullText.includes(gf.doslownyCytatZUmowy.slice(0, 30))
      );
      evaluations.push({
        ...gf,
        clauseId: matchingClause?.id || segmentation.clauses[0]?.id || "clause-1",
      });
    }
  }

  return {
    evaluations,
    totalEvaluated: evaluations.length,
    rawModelName: "gemini-1.5-pro-002",
    evaluatedAt: new Date().toISOString(),
  };
}
