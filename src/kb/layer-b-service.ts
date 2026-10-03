import * as crypto from "node:crypto";
import { EliApiClient } from "./eli-client";
import { LegalKbUnit } from "./types";
import { CORE_ACTS_REGISTRY } from "./core-acts-registry";

export interface LayerBActIngestResult {
  eliId: string;
  actTitle: string;
  unitsCreated: LegalKbUnit[];
  isCoreAct: boolean;
  disclaimerNotice: string;
  legalStateDate: string;
}

/**
 * Serwis obsługi WARSTWY B (akty pobierane na żądanie spoza Rdzenia).
 * Zgodnie z regułą 02-prawo-zrodla-aktualnosc.md:
 * Gdy umowa dotyczy dziedziny spoza rdzenia (17 ustaw podstawowych),
 * system pobiera akt z ELI Sejmu, indeksuje jednostki jako „nieprzejrzane przez prawnika”
 * i generuje jednozdaniową informację do raportu.
 */
export class LayerBService {
  private eliClient: EliApiClient;

  constructor(eliClient?: EliApiClient) {
    this.eliClient = eliClient || new EliApiClient();
  }

  /**
   * Sprawdza, czy dany akt należy do 17 aktów Rdzenia (Warstwa A).
   */
  public isCoreAct(eliId: string): boolean {
    const normalized = eliId.trim().toUpperCase();
    return CORE_ACTS_REGISTRY.some(
      (a) => a.baseEliId.toUpperCase() === normalized || a.latestKnownUnifiedEli?.toUpperCase() === normalized
    );
  }

  /**
   * Pobiera akt spoza Rdzenia z API Sejmu ELI i dzieli go na jednostki redakcyjne.
   */
  public async ingestOnDemandAct(eliId: string): Promise<LayerBActIngestResult> {
    const isCore = this.isCoreAct(eliId);
    const meta = await this.eliClient.getActMetadata(eliId);

    if (!meta) {
      throw new Error(`Nie odnaleziono aktu w oficjalnym API Sejmu RP dla identyfikatora ELI: ${eliId}`);
    }

    const htmlContent = await this.eliClient.fetchActHtmlText(eliId);
    const actTitle = meta.title || `Akt prawny ${eliId}`;
    const legalStateDate = meta.legalStatusDate || meta.announcementDate || new Date().toISOString().slice(0, 10);

    const unitsCreated: LegalKbUnit[] = [];

    if (htmlContent) {
      // Podział tekstu HTML na artykuły
      const cleanText = htmlContent
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const articleMatches = cleanText.split(/(?=\bArt\.\s*\d+[a-z]*\.)/i);

      for (const rawArticle of articleMatches) {
        const trimmed = rawArticle.trim();
        const headerMatch = trimmed.match(/^Art\.\s*(\d+[a-z]*)\./i);
        if (headerMatch && trimmed.length > 20) {
          const artNum = headerMatch[1];
          const editorialUnit = `art. ${artNum}`;
          const unitId = `layer-b-${meta.publisher.toLowerCase()}-${meta.year}-${meta.pos}-art-${artNum}`;
          const contentHash = crypto.createHash("sha256").update(trimmed, "utf8").digest("hex");

          unitsCreated.push({
            id: unitId,
            unitType: "statute",
            actTitle,
            publicationAddress: `${meta.publisher} ${meta.year} poz. ${meta.pos}`,
            editorialUnit,
            content: trimmed,
            sourceUrl: `https://api.sejm.gov.pl/eli/acts/${meta.publisher}/${meta.year}/${meta.pos}`,
            fetchDate: new Date().toISOString().slice(0, 10),
            legalStateDate,
            contentHashSha256: contentHash,
            status: "needs_review", // oznaczenie jako nieprzejrzane przez prawnika
            contractTypeTags: ["warstwa_b", "na_zadanie"],
            keywords: [editorialUnit, actTitle],
            officialCitation: `${meta.publisher} z ${meta.year} r. poz. ${meta.pos}, ${editorialUnit}`,
            eliAddress: meta.ELI,
            freshnessNotes: "Akt pobrany na żądanie z API Sejmu ELI (Warstwa B). Wymaga weryfikacji przez prawnika.",
          });
        }
      }
    }

    const disclaimerNotice = `Raport uwzględnia przepisy z aktu „${actTitle}”, pobranego automatycznie z oficjalnego rejestru Sejmu RP (ELI), które nie zostały jeszcze indywidualnie zweryfikowane przez prawnika.`;

    return {
      eliId: meta.ELI,
      actTitle,
      unitsCreated,
      isCoreAct: isCore,
      disclaimerNotice,
      legalStateDate,
    };
  }
}
