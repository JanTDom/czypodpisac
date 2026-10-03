import { EliActMetadata, EliActMetadataSchema } from "./types";

export interface EliClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  mockFetcher?: (url: string) => Promise<any>;
}

export class EliApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private mockFetcher?: (url: string) => Promise<any>;

  constructor(options: EliClientOptions = {}) {
    this.baseUrl = (options.baseUrl || "https://api.sejm.gov.pl/eli").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.mockFetcher = options.mockFetcher;
  }

  /**
   * Normalizuje identyfikator ELI (np. "DU/2001/733" lub "DU/1964/93") do parametrów ścieżki.
   */
  public parseEliId(eliId: string): { publisher: string; year: number; pos: number } {
    const parts = eliId.split("/").map((p) => p.trim());
    if (parts.length === 3) {
      return {
        publisher: parts[0],
        year: parseInt(parts[1], 10),
        pos: parseInt(parts[2], 10),
      };
    }
    throw new Error(`Nieprawidłowy format identyfikatora ELI: ${eliId}. Oczekiwano np. 'DU/2001/733'.`);
  }

  /**
   * Pobiera metadane aktu z oficjalnego API Sejmu RP (ELI).
   */
  public async getActMetadata(eliId: string): Promise<EliActMetadata | null> {
    const { publisher, year, pos } = this.parseEliId(eliId);
    const url = `${this.baseUrl}/acts/${publisher}/${year}/${pos}`;

    try {
      let rawData: any;

      if (this.mockFetcher) {
        rawData = await this.mockFetcher(url);
      } else {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "UmowaCheck-LegalAuditor/1.0 (audyt-prawny@umowacheck.pl)",
          },
        });
        clearTimeout(timer);

        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`Błąd API Sejmu ELI (${response.status}): ${response.statusText}`);
        }

        rawData = await response.json();
      }

      // Ekstrakcja najnowszego tekstu jednolitego (pierwszy z listy "Inf. o tekście jednolitym")
      const unifiedList = rawData.references?.["Inf. o tekście jednolitym"] || [];
      const latestUnifiedId = unifiedList.length > 0 ? unifiedList[0].id : undefined;

      // Ekstrakcja aktów zmieniających
      const amendingActsRaw = rawData.references?.["Akty zmieniające"] || [];
      const recentAmendingActs = amendingActsRaw.map((a: any) => ({
        id: a.id,
        date: a.date,
      }));

      const metadata: EliActMetadata = {
        ELI: rawData.ELI || `${publisher}/${year}/${pos}`,
        title: rawData.title || "",
        publisher: rawData.publisher || publisher,
        year: rawData.year || year,
        pos: rawData.pos || pos,
        status: rawData.status || "nieznany",
        inForce: rawData.inForce || "UNKNOWN",
        announcementDate: rawData.announcementDate,
        changeDate: rawData.changeDate,
        legalStatusDate: rawData.legalStatusDate,
        latestUnifiedTextId: latestUnifiedId,
        amendingActsCount: amendingActsRaw.length,
        recentAmendingActs,
      };

      return EliActMetadataSchema.parse(metadata);
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`Przekroczono limit czasu połączenia z API Sejmu ELI (${this.timeoutMs}ms) dla aktu: ${eliId}`);
      }
      throw err;
    }
  }

  /**
   * Pobiera najnowszy tekst jednolity danego aktu podstawowego.
   */
  public async getLatestUnifiedAct(baseEliId: string): Promise<EliActMetadata | null> {
    const baseMeta = await this.getActMetadata(baseEliId);
    if (!baseMeta) return null;

    if (!baseMeta.latestUnifiedTextId) {
      return baseMeta; // brak tekstu jednolitego, sam akt jest aktualnym źródłem
    }

    return await this.getActMetadata(baseMeta.latestUnifiedTextId);
  }

  /**
   * Sprawdza, czy od podanej daty stanu prawnego pojawiły się nowe akty zmieniające.
   */
  public async checkAmendingActsSince(
    baseEliId: string,
    sinceDate: string
  ): Promise<{ hasNewAmendingActs: boolean; newActs: Array<{ id: string; date?: string }> }> {
    const meta = await this.getActMetadata(baseEliId);
    if (!meta) {
      return { hasNewAmendingActs: false, newActs: [] };
    }

    const newActs = meta.recentAmendingActs.filter((a) => {
      if (!a.date) return false;
      return a.date > sinceDate;
    });

    return {
      hasNewAmendingActs: newActs.length > 0,
      newActs,
    };
  }

  /**
   * Pobiera oficjalny tekst HTML aktu ze strony Sejmu ELI.
   */
  public async fetchActHtmlText(eliId: string): Promise<string | null> {
    const { publisher, year, pos } = this.parseEliId(eliId);
    const url = `${this.baseUrl}/acts/${publisher}/${year}/${pos}/text.html`;

    try {
      if (this.mockFetcher) {
        return await this.mockFetcher(url);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "text/html",
          "User-Agent": "UmowaCheck-LegalAuditor/1.0",
        },
      });
      clearTimeout(timer);

      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }
}
