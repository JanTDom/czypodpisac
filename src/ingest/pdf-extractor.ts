import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Ekstrakcja tekstu z pliku PDF przy użyciu pdfjs-dist.
 * Zwraca wyciągnięty tekst oraz liczbę stron.
 */
export async function extractTextFromPdf(pdfBuffer: Uint8Array): Promise<{ text: string; pageCount: number }> {
  const loadingTask = getDocument({
    data: pdfBuffer,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const pageCount = doc.numPages;
  const pageTexts: string[] = [];

  for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    let currentLine = "";
    let lastY: number | null = null;
    const lines: string[] = [];

    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string") continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
        }
        currentLine = "";
      }
      currentLine += item.str;
      lastY = y;
    }

    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    if (lines.length > 0) {
      pageTexts.push(lines.join("\n"));
    }
  }

  const fullText = pageTexts.join("\n\n").trim();
  return {
    text: fullText,
    pageCount,
  };
}
