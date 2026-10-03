import * as fs from "node:fs";
import * as path from "node:path";
import { LegalKbUnit, LegalKbUnitSchema, LegalKbIndex, LegalKbIndexSchema } from "./types";

export * from "./types";
export * from "./eli-client";
export * from "./freshness-guard";

export class LegalKnowledgeBase {
  private static instance: LegalKnowledgeBase | null = null;
  private unitsMap: Map<string, LegalKbUnit> = new Map();
  private indexData: LegalKbIndex | null = null;
  private kbPath: string;

  constructor(customPath?: string) {
    this.kbPath = customPath || path.resolve(process.cwd(), "legal-kb");
    this.loadAll();
  }

  public static getInstance(customPath?: string): LegalKnowledgeBase {
    if (!LegalKnowledgeBase.instance) {
      LegalKnowledgeBase.instance = new LegalKnowledgeBase(customPath);
    }
    return LegalKnowledgeBase.instance;
  }

  private loadAll(): void {
    const indexPath = path.join(this.kbPath, "index.json");
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Baza legal-kb nie została zainicjalizowana. Brak pliku: ${indexPath}`);
    }

    const rawIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    this.indexData = LegalKbIndexSchema.parse(rawIndex);

    for (const item of this.indexData.units) {
      const fullPath = path.join(this.kbPath, item.filePath);
      if (fs.existsSync(fullPath)) {
        const rawContent = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        const validated = LegalKbUnitSchema.parse(rawContent);
        this.unitsMap.set(validated.id, validated);
      } else {
        console.warn(`Ostrzeżenie: Plik jednostki ${item.id} nie istnieje: ${fullPath}`);
      }
    }
  }

  public getById(id: string): LegalKbUnit | undefined {
    return this.unitsMap.get(id);
  }

  public hasValidSource(id: string): boolean {
    const unit = this.unitsMap.get(id);
    return !!unit && unit.status === "active";
  }

  public getByContractType(contractType: string): LegalKbUnit[] {
    return Array.from(this.unitsMap.values()).filter(
      (u) => u.contractTypeTags.includes(contractType) || u.contractTypeTags.includes("konsument")
    );
  }

  public searchByKeywords(query: string, contractType?: string): LegalKbUnit[] {
    const lowerQuery = query.toLowerCase();
    const rawTokens = lowerQuery.split(/[\s,.;:!?()-]+/).filter((t) => t.length > 2);
    
    // Prosty, deterministyczny stemmer dla języka polskiego
    const getPolishStem = (word: string): string => {
      if (word.length <= 4) return word;
      return word.replace(/(ości|enia|enie|eniach|eniom|eniami|eniu|ować|ania|anie|aniach|aniom|aniami|ach|ami|ych|ich|ego|emu|ej|em|om|ie|ów|ce|że|ek|ka|ki|kę|ko|ku|y|a|e|i|u|o)$/i, "");
    };

    const stems = rawTokens.map(getPolishStem);

    return Array.from(this.unitsMap.values())
      .filter((u) => {
        if (contractType && !u.contractTypeTags.includes(contractType) && !u.contractTypeTags.includes("konsument")) {
          return false;
        }
        const text = `${u.editorialUnit} ${u.actTitle} ${u.content} ${u.keywords.join(" ")}`.toLowerCase();
        return (
          rawTokens.some((tok) => text.includes(tok)) ||
          stems.some((stem) => text.includes(stem))
        );
      })
      .sort((a, b) => {
        const textA = `${a.editorialUnit} ${a.actTitle} ${a.content} ${a.keywords.join(" ")}`.toLowerCase();
        const textB = `${b.editorialUnit} ${b.actTitle} ${b.content} ${b.keywords.join(" ")}`.toLowerCase();
        const scoreA = stems.filter((stem) => textA.includes(stem)).length;
        const scoreB = stems.filter((stem) => textB.includes(stem)).length;
        return scoreB - scoreA;
      });
  }

  public isFresh(id: string): boolean {
    const unit = this.unitsMap.get(id);
    return !!unit && unit.status === "active";
  }

  public setUnitStatus(
    id: string,
    status: "active" | "repealed" | "amended" | "needs_review",
    notes?: string
  ): void {
    const unit = this.unitsMap.get(id);
    if (!unit) {
      throw new Error(`Nie odnaleziono jednostki w legal-kb o id: ${id}`);
    }
    unit.status = status;
    if (notes) {
      unit.freshnessNotes = notes;
    }
    unit.lastVerifiedAt = new Date().toISOString();
  }

  /**
   * Zwraca wyłącznie aktualnie obowiązujące przepisy (stan prawny active).
   * Odrzuca jednostki uchylone, zmienione lub wymagające przeglądu.
   */
  public findCurrentLaw(
    query: string,
    options: { contractType?: string; onlyActive?: boolean } = { onlyActive: true }
  ): LegalKbUnit[] {
    const allMatches = this.searchByKeywords(query, options.contractType);
    if (options.onlyActive === false) {
      return allMatches;
    }
    return allMatches.filter((u) => u.status === "active");
  }

  public getAllUnits(): LegalKbUnit[] {
    return Array.from(this.unitsMap.values());
  }

  public getIndex(): LegalKbIndex {
    if (!this.indexData) {
      throw new Error("Indeks bazy prawnej nie został załadowany");
    }
    return this.indexData;
  }
}
