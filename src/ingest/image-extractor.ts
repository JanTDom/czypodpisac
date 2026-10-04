import { z } from "zod";
import { GeminiClient } from "../llm/gemini-client";
import { geminiConfig } from "../config/models";

const OcrResultSchema = z.object({
  extractedText: z.string().describe("Dokładny, pełny odczytany tekst dokumentu ze zdjęć"),
  readability: z.enum(["dobra", "słaba", "nieczytelna"]),
  detectedType: z.string().optional().describe("Wykryty typ umowy lub nagłówek"),
});

export interface ImageInput {
  mimeType: string;
  dataBase64: string;
}

/**
 * Ekstrakcja tekstu z jednego lub wielu zdjęć umowy za pomocą modelu multimodalnego Gemini.
 * Jeśli Gemini nie jest skonfigurowany lub obraz jest nieczytelny, zwraca błąd z instrukcją dla użytkownika.
 */
export async function extractTextFromImages(
  images: ImageInput[],
  correlationId: string,
  client: GeminiClient = new GeminiClient()
): Promise<{ text: string; readability: string }> {
  if (images.length === 0) {
    throw new Error("Brak zdjęć do odczytu.");
  }

  const result = await client.generateStructured({
    role: "segmentation",
    model: geminiConfig.fastModel,
    systemInstruction:
      "Jesteś precyzyjnym systemem odczytu tekstu (OCR) z oficjalnych dokumentów prawnych i umów. " +
      "Twoim zadaniem jest dokładne przepisanie całej treści umowy linijka po linijce, paragraf po paragrafie. " +
      "Nie pomijaj żadnych zdań, kwot ani podpisów. Jeśli tekst jest niewyraźny, oznacz czytelność jako 'słaba' lub 'nieczytelna'.",
    task: "Odczytaj dokładnie całą treść umowy ze wszystkich załączonych zdjęć stron dokumentu.",
    inlineFiles: images.map((img) => ({
      mimeType: img.mimeType,
      dataBase64: img.dataBase64,
    })),
    schema: OcrResultSchema,
    correlationId,
  });

  if (!result.ok) {
    if (result.reason === "not_configured") {
      throw new Error(
        "Odczyt tekstu ze zdjęć wymaga aktywnego modułu wizyjnego. Wklej tekst umowy albo wgraj plik PDF lub DOCX."
      );
    }
    throw new Error(
      "Nie udało się odczytać treści ze zdjęcia. Upewnij się, że zdjęcie jest ostre i dobrze oświetlone, albo wklej treść umowy."
    );
  }

  if (result.value.readability === "nieczytelna" || result.value.extractedText.trim().length < 50) {
    throw new Error(
      "Zdjęcie jest zbyt niewyraźne lub nie zawiera tekstu umowy. Zrób zdjęcie z bliska przy dobrym świetle lub wklej tekst."
    );
  }

  return {
    text: result.value.extractedText.trim(),
    readability: result.value.readability,
  };
}
