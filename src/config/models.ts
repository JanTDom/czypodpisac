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

export const GeminiModelConfigSchema = z.object({
  /** Identyfikator projektu Google Cloud */
  projectId: z.string().default(process.env.GCP_PROJECT_ID || "czypodpisac-prod"),

  /** Region Vertex AI w UE */
  region: z.string().default(process.env.GCP_REGION || "europe-west1"),

  /** Szybki model: klasyfikacja, segmentacja, pytania kontekstowe, multimodalny ingest */
  fastModel: z.string().default(process.env.GEMINI_FAST_MODEL || "gemini-2.0-flash"),

  /** Najmocniejszy model: ocena klauzul i generowanie poprawek */
  flagshipModel: z.string().default(process.env.GEMINI_PRO_MODEL || "gemini-1.5-pro-002"),

  /** Weryfikator: osobne wywołanie najmocniejszego modelu z odizolowanym promptem */
  verifierModel: z.string().default(process.env.GEMINI_VERIFIER_MODEL || "gemini-1.5-pro-002"),

  /** Wielojęzyczny model embeddingów */
  embeddingModel: z.string().default(process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004"),

  /** Wymiary wektora embeddingów (768 dla text-embedding-004) */
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
export const geminiConfig: GeminiModelConfig = GeminiModelConfigSchema.parse({
  projectId: process.env.GCP_PROJECT_ID,
  region: process.env.GCP_REGION,
  fastModel: process.env.GEMINI_FAST_MODEL,
  flagshipModel: process.env.GEMINI_PRO_MODEL,
  verifierModel: process.env.GEMINI_VERIFIER_MODEL,
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL,
});
