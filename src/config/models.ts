import { z } from "zod";

/**
 * Konfiguracja modeli Gemini przez Vertex AI w regionie UE.
 * Zgodnie z regułą 03-gemini-api.md:
 * - Nazwy modeli NIE są zaszyte w logice biznesowej, lecz zdefiniowane w jednym miejscu.
 * - Klucze i konta serwisowe wyłącznie po stronie serwera w zmiennych środowiskowych.
 * - Regiony wyłącznie w UE (preferowany europe-central2 Warszawa / europe-west1).
 */

export const DEFAULT_SAMPLING_PARAMS = {
  classification: {
    temperature: 0.0,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
  segmentation: {
    temperature: 0.0,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
  evaluation: {
    temperature: 0.0,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
  verifier: {
    temperature: 0.0,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
  generation: {
    temperature: 0.2,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
};

export const DEFAULT_CONTEXT_CACHING = {
  enabled: true,
  ttlMinutes: 60,
  minTokenThreshold: 32768,
};

/*
 * Domyślne nazwy modeli pochodzą z listy modeli w dokumentacji Gemini
 * (ai.google.dev/gemini-api/docs/models, sprawdzone 2026-10-03):
 * gemini-3.6-flash to stabilny model podany tam jako przykład do produkcji,
 * gemini-2.5-pro to stabilny model klasy Pro (gemini-3.1-pro jest tylko w wersji preview),
 * gemini-embedding-001 to stabilny model embeddingów.
 * Dostępności w regionie UE Vertex AI nie dało się potwierdzić wywołaniem,
 * dlatego każdą wartość można nadpisać zmienną środowiskową.
 */
export const GeminiModelConfigSchema = z.object({
  /** Identyfikator projektu Google Cloud. Brak = wywołania modelu wyłączone. */
  projectId: z.string().min(1).optional(),

  /** Region Vertex AI w UE */
  region: z.string().default("europe-west1"),

  /** Szybki model: klasyfikacja, segmentacja, pytania kontekstowe, multimodalny ingest */
  fastModel: z.string().default("gemini-3.6-flash"),

  /** Najmocniejszy model: ocena klauzul i generowanie poprawek */
  flagshipModel: z.string().default("gemini-2.5-pro"),

  /** Weryfikator: osobne wywołanie najmocniejszego modelu z odizolowanym promptem */
  verifierModel: z.string().default("gemini-2.5-pro"),

  /** Wielojęzyczny model embeddingów */
  embeddingModel: z.string().default("gemini-embedding-001"),

  /** Wymiar wektora embeddingów (gemini-embedding-001 przyjmuje outputDimensionality 768) */
  embeddingDimensions: z.number().int().default(768),

  /** Parametry próbkowania dla poszczególnych ról */
  samplingParams: z
    .object({
      classification: z.object({
        temperature: z.number().default(0.0),
        topP: z.number().default(0.95),
        maxOutputTokens: z.number().default(1024),
      }),
      segmentation: z.object({
        temperature: z.number().default(0.0),
        topP: z.number().default(0.95),
        maxOutputTokens: z.number().default(4096),
      }),
      evaluation: z.object({
        temperature: z.number().default(0.0),
        topP: z.number().default(0.95),
        maxOutputTokens: z.number().default(4096),
      }),
      verifier: z.object({
        temperature: z.number().default(0.0),
        topP: z.number().default(0.95),
        maxOutputTokens: z.number().default(1024),
      }),
      generation: z.object({
        temperature: z.number().default(0.2),
        topP: z.number().default(0.95),
        maxOutputTokens: z.number().default(4096),
      }),
    })
    .default(DEFAULT_SAMPLING_PARAMS),

  /** Ustawienia Context Caching Vertex AI dla stałych części promptu */
  contextCaching: z
    .object({
      enabled: z.boolean().default(true),
      ttlMinutes: z.number().default(60),
      minTokenThreshold: z.number().default(32768),
    })
    .default(DEFAULT_CONTEXT_CACHING),
});

export type GeminiModelConfig = z.infer<typeof GeminiModelConfigSchema>;

/**
 * Singleton konfiguracji modeli dla całej aplikacji.
 */
const envOrUndefined = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
};

export const geminiConfig: GeminiModelConfig = GeminiModelConfigSchema.parse({
  projectId: envOrUndefined("GCP_PROJECT_ID"),
  region: envOrUndefined("GCP_REGION"),
  fastModel: envOrUndefined("GEMINI_FAST_MODEL"),
  flagshipModel: envOrUndefined("GEMINI_PRO_MODEL"),
  verifierModel: envOrUndefined("GEMINI_VERIFIER_MODEL"),
  embeddingModel: envOrUndefined("GEMINI_EMBEDDING_MODEL"),
});
