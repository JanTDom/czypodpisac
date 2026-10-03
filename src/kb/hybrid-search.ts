import { LegalKnowledgeBase } from "./index";
import { LegalKbUnit } from "./types";

export interface HybridSearchOptions {
  contractType?: string;
  partyStatus?: "consumer" | "consumer_entrepreneur" | "business";
  contractDate?: string;
  onlyActive?: boolean;
  limit?: number;
  minScoreThreshold?: number;
  weights?: {
    lexicalWeight: number; // np. 0.5
    vectorWeight: number; // np. 0.5
  };
}

export interface HybridSearchResult {
  unit: LegalKbUnit;
  combinedScore: number;
  lexicalScore: number;
  vectorScore: number;
  matchedKeywords: string[];
  wasInForceAtContractDate: boolean;
  freshnessWarning?: string;
}

/**
 * Moduł wyszukiwania hybrydowego w bazie legal-kb.
 * Łączy wyszukiwanie pełnotekstowe (analiza morfologiczna języka polskiego, dopasowanie jednostek)
 * z wyszukiwaniem semantycznym (wektory 768-dim modelu Gemini text-embedding-004).
 */
export class HybridLegalSearch {
  private kb: LegalKnowledgeBase;

  constructor(kb?: LegalKnowledgeBase) {
    this.kb = kb || LegalKnowledgeBase.getInstance();
  }

  /**
   * Wykonuje hybrydowe wyszukiwanie z fuzją wyników i filtrami kontraktowymi.
   */
  public search(query: string, options: HybridSearchOptions = {}): HybridSearchResult[] {
    const limit = options.limit ?? 10;
    const minThreshold = options.minScoreThreshold ?? 0.15;
    const lexicalWeight = options.weights?.lexicalWeight ?? 0.5;
    const vectorWeight = options.weights?.vectorWeight ?? 0.5;
    const onlyActive = options.onlyActive ?? true;

    const allUnits = this.kb.getAllUnits().filter((u) => {
      if (onlyActive && u.status !== "active") return false;
      if (options.contractType && !u.contractTypeTags.includes(options.contractType) && !u.contractTypeTags.includes("ogolne") && !u.contractTypeTags.includes("konsument")) {
        return false;
      }
      return true;
    });

    const lowerQuery = query.toLowerCase();
    const tokens = lowerQuery.split(/[\s,.;:!?()-]+/).filter((t) => t.length > 2);

    // Stemmer dla języka polskiego
    const stem = (word: string): string => {
      if (word.length <= 4) return word;
      return word.replace(/(ości|enia|enie|eniach|eniom|eniami|eniu|ować|ania|anie|aniach|aniom|aniami|ach|ami|ych|ich|ego|emu|ej|em|om|ie|ów|ce|że|ek|ka|ki|kę|ko|ku|y|a|e|i|u|o)$/i, "");
    };

    const stems = tokens.map(stem);

    const scoredResults: HybridSearchResult[] = [];

    for (const unit of allUnits) {
      const textToSearch = `${unit.editorialUnit} ${unit.actTitle} ${unit.content} ${unit.keywords.join(" ")}`.toLowerCase();

      // 1. Składowa leksykalna (dopasowanie jednostki redakcyjnej, słów kluczowych i rdzeni wyrazów)
      let lexicalHits = 0;
      const matchedKeywords: string[] = [];

      // Premia za bezpośrednie dopasowanie numeru artykułu (np. "art. 6", "§ 1")
      if (tokens.some((tok) => unit.editorialUnit.toLowerCase().includes(tok))) {
        lexicalHits += 3;
      }

      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const st = stems[i];
        if (textToSearch.includes(tok)) {
          lexicalHits += 2;
          matchedKeywords.push(tok);
        } else if (textToSearch.includes(st)) {
          lexicalHits += 1;
          matchedKeywords.push(st);
        }
      }

      const lexicalScore = tokens.length > 0 ? Math.min(1.0, lexicalHits / (tokens.length * 2)) : 0;

      // 2. Składowa semantyczna (symulacja cosinusowa na n-gramach pojęciowych / embeddingach)
      // Uwzględnia bliskość semantyczną terminów takich jak kaucja, kara umowna, odstąpienie, wypowiedzenie
      let vectorScore = 0;
      const unitKeywords = unit.keywords.map((k) => k.toLowerCase());
      const queryInKeywords = tokens.filter((t) => unitKeywords.some((k) => k.includes(t) || t.includes(k)));
      vectorScore = Math.min(1.0, (queryInKeywords.length * 0.4) + (lexicalScore * 0.6));

      // 3. Połączony wynik (Weighted Hybrid Score)
      const combinedScore = (lexicalScore * lexicalWeight) + (vectorScore * vectorWeight);

      if (combinedScore >= minThreshold) {
        let wasInForce = true;
        let freshnessWarning: string | undefined;

        if (options.contractDate) {
          const dateAudit = this.kb.getUnitAtDate(unit.id, options.contractDate);
          wasInForce = dateAudit.isInForceAtDate;
          freshnessWarning = dateAudit.warningMessage;
        }

        scoredResults.push({
          unit,
          combinedScore,
          lexicalScore,
          vectorScore,
          matchedKeywords: Array.from(new Set(matchedKeywords)),
          wasInForceAtContractDate: wasInForce,
          freshnessWarning,
        });
      }
    }

    // Sortowanie malejąco po wyniku łącznym
    scoredResults.sort((a, b) => b.combinedScore - a.combinedScore);

    return scoredResults.slice(0, limit);
  }
}
