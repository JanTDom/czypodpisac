import * as crypto from "node:crypto";
import { EvaluationOutput } from "../schemas/stage06-evaluation";
import {
  ValidationOutput,
  ValidatedFinding,
  GeminiVerifierInput,
  GeminiVerifierOutput,
} from "../schemas/stage07-validation";
import { LegalKnowledgeBase } from "../../kb";

export interface GeminiVerifierClient {
  verify(input: GeminiVerifierInput): Promise<GeminiVerifierOutput>;
}

/**
 * Domyślny, deterministyczny weryfikator tezy prawnej (używany lokalnie lub w testach).
 * Weryfikuje, czy powołane przepisy prawne semantycznie popierają postawioną tezę.
 */
export class DeterministicGeminiVerifier implements GeminiVerifierClient {
  private kb: LegalKnowledgeBase;

  constructor(kb?: LegalKnowledgeBase) {
    this.kb = kb || LegalKnowledgeBase.getInstance();
  }

  public async verify(input: GeminiVerifierInput): Promise<GeminiVerifierOutput> {
    const supportedSources: string[] = [];
    let hasStrongSupport = false;

    for (const src of input.sources) {
      const unit = this.kb.getById(src.sourceId);
      if (!unit || unit.status !== "active") continue;

      const sourceContent = unit.content.toLowerCase();
      const thesisLower = input.thesis.toLowerCase();
      const quoteLower = input.quoteFromContract.toLowerCase();

      // Weryfikacja powiązania: czy przepis odnosi się do limitu/abuzywności/terminu
      const isLimitThesis = thesisLower.includes("limit") || thesisLower.includes("przekracza") || thesisLower.includes("kaucj");
      const isPenaltyThesis = thesisLower.includes("kara") || thesisLower.includes("niedozwolon") || thesisLower.includes("wypowiedzen");

      if (isLimitThesis && (sourceContent.includes("dwunastokrotnośc") || sourceContent.includes("sześciokrotnośc") || sourceContent.includes("kaucja"))) {
        supportedSources.push(src.sourceId);
        hasStrongSupport = true;
      } else if (isPenaltyThesis && (sourceContent.includes("sprzeczny z dobrymi obyczajami") || sourceContent.includes("rażąco naruszając") || sourceContent.includes("odstąpienie") || sourceContent.includes("kara"))) {
        supportedSources.push(src.sourceId);
        hasStrongSupport = true;
      } else if (supportedSources.length === 0 && unit.keywords.some((k) => thesisLower.includes(k.toLowerCase()))) {
        supportedSources.push(src.sourceId);
        hasStrongSupport = true;
      }
    }

    if (hasStrongSupport && supportedSources.length > 0) {
      return {
        werdykt: "popiera",
        uzasadnienie: `Powołane źródła prawne (${supportedSources.join(", ")}) wprost uzasadniają postawione zastrzeżenie prawne.`,
        popierajaceZrodlaIds: supportedSources,
      };
    }

    return {
      werdykt: "niepewne",
      uzasadnienie: "Brak bezpośredniego odniesienia przepisu do specyficznego sformułowania w umowie — wymagana ocena sądu.",
      popierajaceZrodlaIds: [],
      watpliwosci: "Postanowienie może podlegać indywidualnej interpretacji stron.",
    };
  }
}

/**
 * Etap 7: Walidacja dwuwarstwowa (kod + weryfikator Gemini)
 * Sprawdza:
 * 1. Czy cytat z umowy występuje dosłownie w treści dokumentu.
 * 2. Czy każde ID źródła istnieje w legal-kb/ i obowiązywało na dzień umowy.
 * 3. Czy odizolowany Gemini-weryfikator potwierdza, że źródło popiera tezę.
 */
export async function executeValidation(
  evaluationOutput: EvaluationOutput,
  fullContractText: string,
  contractDate: string = new Date().toISOString().slice(0, 10),
  kb: LegalKnowledgeBase = LegalKnowledgeBase.getInstance(),
  verifier: GeminiVerifierClient = new DeterministicGeminiVerifier(kb)
): Promise<ValidationOutput> {
  const verifiedFindings: ValidatedFinding[] = [];
  const unverifiedFindings: ValidatedFinding[] = [];
  let rejectedCount = 0;
  let isGroundingClean = true;

  const normalizedFullText = fullContractText.replace(/\s+/g, " ").toLowerCase();

  for (const evalItem of evaluationOutput.evaluations) {
    const findingId = crypto.randomUUID();

    // 1. KOD: Dosłowność cytatu z umowy
    const normalizedQuote = evalItem.doslownyCytatZUmowy.replace(/\s+/g, " ").trim().toLowerCase();
    const quoteExact = fullContractText.includes(evalItem.doslownyCytatZUmowy);
    const quoteNormalized = normalizedFullText.includes(normalizedQuote);
    const isQuoteVerified = quoteExact || quoteNormalized;

    // 2. KOD: Weryfikacja źródeł w legal-kb/
    const verifiedSourceIds: string[] = [];
    const rejectedSourceIds: string[] = [];

    for (const sourceId of evalItem.zrodlaIds) {
      const unit = kb.getById(sourceId);
      if (!unit) {
        // ZMYŚLONE ŹRÓDŁO: natychmiastowe odrzucenie!
        rejectedSourceIds.push(sourceId);
        isGroundingClean = false;
        continue;
      }

      // Sprawdzenie stanu prawnego na dzień podpisania umowy
      const dateAudit = kb.getUnitAtDate(sourceId, contractDate);
      if (dateAudit.isInForceAtDate) {
        verifiedSourceIds.push(sourceId);
      } else {
        rejectedSourceIds.push(sourceId);
      }
    }

    // Jeśli uwaga opierała się WYŁĄCZNIE na zmyślonym lub nieaktualnym źródle — odrzucamy ją całkowicie
    if (verifiedSourceIds.length === 0) {
      rejectedCount++;
      isGroundingClean = false;
      continue;
    }

    // 3. GEMINI-WERYFIKATOR: Odizolowane sprawdzenie, czy źródło popiera tezę
    const sourcesForVerifier = verifiedSourceIds.map((id) => {
      const u = kb.getById(id)!;
      return {
        sourceId: u.id,
        editorialUnit: u.editorialUnit,
        legalText: u.content,
      };
    });

    const verifierResult = await verifier.verify({
      findingId,
      quoteFromContract: evalItem.doslownyCytatZUmowy,
      thesis: evalItem.tytulPoLudzku,
      sources: sourcesForVerifier,
    });

    const isFullyVerified = isQuoteVerified && verifiedSourceIds.length > 0 && verifierResult.werdykt === "popiera";

    const finding: ValidatedFinding = {
      id: findingId,
      clauseId: evalItem.clauseId,
      checklistItemId: evalItem.checklistItemId,
      status: isFullyVerified ? "verified" : "needs_verification",
      ocena: evalItem.ocena,
      tytulPoLudzku: evalItem.tytulPoLudzku,
      doslownyCytatZUmowy: evalItem.doslownyCytatZUmowy,
      cytatZweryfikowany: isQuoteVerified,
      uzasadnienie: evalItem.uzasadnienie,
      zweryfikowaneZrodlaIds: verifiedSourceIds,
      odrzuconeZrodlaIds: rejectedSourceIds,
      pewnosc: evalItem.pewnosc,
      geminiVerifierVerdict: verifierResult.werdykt,
      kwotaRyzyka: evalItem.kwotaRyzyka,
      zalozeniaKwoty: evalItem.zalozeniaKwoty,
      powodOdrzuceniaLubNiepewnosci: !isFullyVerified
        ? `Cytat zweryfikowany: ${isQuoteVerified}, werdykt weryfikatora: ${verifierResult.werdykt}`
        : undefined,
    };

    if (isFullyVerified) {
      verifiedFindings.push(finding);
    } else {
      unverifiedFindings.push(finding);
    }
  }

  return {
    verifiedFindings,
    unverifiedFindings,
    rejectedCount,
    isGroundingClean,
  };
}
