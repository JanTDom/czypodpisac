import { describe, it, expect } from "vitest";
import * as zlib from "node:zlib";
import { extractTextFromDocx, parseDocxXml } from "../src/ingest/docx-extractor";

function createMockDocxBuffer(xmlContent: string): Buffer {
  const fileData = zlib.deflateRawSync(Buffer.from(xmlContent, "utf-8"));
  const fileName = "word/document.xml";
  const fileNameBuf = Buffer.from(fileName, "utf-8");

  // Local file header (30 bytes + fileName + extra)
  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0); // signature
  lfh.writeUInt16LE(20, 4); // version
  lfh.writeUInt16LE(0, 6); // flags
  lfh.writeUInt16LE(8, 8); // DEFLATE
  lfh.writeUInt16LE(0, 10); // time
  lfh.writeUInt16LE(0, 12); // date
  lfh.writeUInt32LE(0, 14); // crc32 (dummy)
  lfh.writeUInt32LE(fileData.length, 18); // compressed size
  lfh.writeUInt32LE(Buffer.byteLength(xmlContent), 22); // uncompressed size
  lfh.writeUInt16LE(fileNameBuf.length, 26); // file name length
  lfh.writeUInt16LE(0, 28); // extra field length

  return Buffer.concat([lfh, fileNameBuf, fileData]);
}

describe("DOCX Extractor", () => {
  it("poprawnie wyciąga tekst z akapitów w:p i fragmentów w:t", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>UMOWA ZLECENIA</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Zawarta w dniu 4 października 2026 r.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

    const text = parseDocxXml(xml);
    expect(text).toContain("UMOWA ZLECENIA");
    expect(text).toContain("Zawarta w dniu 4 października 2026 r.");
  });

  it("odczytuje bufor ZIP DOCX i zwraca czysty tekst", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>§ 1. Przedmiot umowy &amp; warunki</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

    const docxBuf = createMockDocxBuffer(xml);
    const result = extractTextFromDocx(docxBuf);
    expect(result).toBe("§ 1. Przedmiot umowy & warunki");
  });
});
