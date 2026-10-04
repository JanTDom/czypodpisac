import * as zlib from "node:zlib";

/**
 * Prosty, bezpieczny i bezstanowy parser plików DOCX (ZIP XML) w Node.js.
 * Wyciąga czysty tekst z word/document.xml bez zewnętrznych bibliotek.
 */
export function extractTextFromDocx(buffer: Buffer): string {
  const fileMap = readZipFiles(buffer);
  const documentXml = fileMap.get("word/document.xml");

  if (!documentXml) {
    throw new Error("Nieprawidłowy plik DOCX: brak pliku word/document.xml.");
  }

  const xmlStr = documentXml.toString("utf-8");
  return parseDocxXml(xmlStr);
}

/**
 * Parsuje XML word/document.xml:
 * - <w:p> to akapity
 * - <w:t> to fragmenty tekstu
 * - <w:tab/> to spacja/tabulator
 * - <w:br/> to łamanie wiersza
 */
export function parseDocxXml(xml: string): string {
  // Usuwamy znaczniki formatowania, zachowując strukturę akapitów
  const paragraphs: string[] = [];
  const pMatches = xml.matchAll(/<w:p\b[^>]*>(.*?)<\/w:p>/gs);

  for (const pMatch of pMatches) {
    const pContent = pMatch[1];
    let pText = "";

    // Zastąp <w:tab/> spacją
    const normalizedP = pContent
      .replace(/<w:tab\b[^>]*\/>/g, " ")
      .replace(/<w:br\b[^>]*\/>/g, "\n");

    const tMatches = normalizedP.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs);
    for (const tMatch of tMatches) {
      pText += decodeXmlEntities(tMatch[1]);
    }

    if (pText.trim().length > 0) {
      paragraphs.push(pText.trim());
    }
  }

  // Fallback: gdyby regex p nie znalazł akapitów (np. nietypowy format)
  if (paragraphs.length === 0) {
    const fallbackMatches = xml.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs);
    let fallbackText = "";
    for (const match of fallbackMatches) {
      fallbackText += decodeXmlEntities(match[1]) + " ";
    }
    return fallbackText.trim();
  }

  return paragraphs.join("\n\n").trim();
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Minimalny czytnik ZIP z pamięci bufora Buffer.
 */
function readZipFiles(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      // Koniec lokalnych nagłówków (początek central directory)
      break;
    }

    const flags = buffer.readUInt16LE(offset + 6);
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const fileNameStart = offset + 30;
    const fileName = buffer.toString("utf-8", fileNameStart, fileNameStart + fileNameLength);

    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    let dataEnd = dataStart + compressedSize;

    // Gdy rozmiar jest 0 i flaga 3 (descriptor po danych), szukamy w Central Directory
    if ((flags & 0x08) !== 0 && compressedSize === 0) {
      break;
    }

    if (dataEnd > buffer.length) {
      break;
    }

    const compressedData = buffer.subarray(dataStart, dataEnd);
    let decompressed: Buffer;

    if (compressionMethod === 0) {
      // Bez kompresji (STORE)
      decompressed = compressedData;
    } else if (compressionMethod === 8) {
      // DEFLATE
      decompressed = zlib.inflateRawSync(compressedData);
    } else {
      // Nieobsługiwana kompresja, pomiń
      offset = dataEnd;
      continue;
    }

    files.set(fileName, decompressed);
    offset = dataEnd;
  }

  // Jeśli przez Local Headers nie udało się znaleźć word/document.xml, odczytaj Central Directory
  if (!files.has("word/document.xml")) {
    readCentralDirectory(buffer, files);
  }

  return files;
}

function readCentralDirectory(buffer: Buffer, files: Map<string, Buffer>): void {
  // Szukaj End of Central Directory (EOCD): 0x06054b50
  let eocdOffset = buffer.length - 22;
  while (eocdOffset >= 0) {
    if (buffer.readUInt32LE(eocdOffset) === 0x06054b50) {
      break;
    }
    eocdOffset -= 1;
  }

  if (eocdOffset < 0) return;

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const cdRecords = buffer.readUInt16LE(eocdOffset + 10);
  let currentOffset = cdOffset;

  for (let i = 0; i < cdRecords && currentOffset + 46 <= buffer.length; i += 1) {
    const signature = buffer.readUInt32LE(currentOffset);
    if (signature !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(currentOffset + 10);
    const compressedSize = buffer.readUInt32LE(currentOffset + 20);
    const fileNameLength = buffer.readUInt16LE(currentOffset + 28);
    const extraLength = buffer.readUInt16LE(currentOffset + 30);
    const commentLength = buffer.readUInt16LE(currentOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(currentOffset + 42);

    const fileName = buffer.toString("utf-8", currentOffset + 46, currentOffset + 46 + fileNameLength);

    if (fileName === "word/document.xml" && localHeaderOffset + 30 <= buffer.length) {
      const localFileNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        files.set(fileName, compressedData);
      } else if (compressionMethod === 8) {
        files.set(fileName, zlib.inflateRawSync(compressedData));
      }
      break;
    }

    currentOffset += 46 + fileNameLength + extraLength + commentLength;
  }
}
