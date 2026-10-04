import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";
import { extractTextFromPdf } from "../../../ingest/pdf-extractor";
import { extractTextFromDocx } from "../../../ingest/docx-extractor";
import { extractTextFromImages, ImageInput } from "../../../ingest/image-extractor";
import { rateLimit } from "../../../lib/request-guards";
import { log } from "../../../lib/logger";

export const dynamic = "force-dynamic";

const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 MB
const MIN_TEXT_CHARS = 80;

function isPdf(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
}

function isZipDocx(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04; // PK..
}

function isImage(buf: Buffer): { ok: boolean; mime: string } {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ok: true, mime: "image/jpeg" };
  }
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ok: true, mime: "image/png" };
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ok: true, mime: "image/webp" };
  }
  return { ok: false, mime: "" };
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "extract", 20);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const allFiles = [...(singleFile ? [singleFile] : []), ...files];

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Nie przesłano żadnego pliku." }, { status: 400 });
    }

    let totalSize = 0;
    for (const f of allFiles) {
      totalSize += f.size;
    }
    if (totalSize > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Rozmiar przesłanych plików przekracza limit 15 MB. Zmniejsz pliki lub wklej tekst." },
        { status: 413 }
      );
    }

    const first = allFiles[0];
    const firstBuf = Buffer.from(await first.arrayBuffer());
    const correlationId = crypto.randomUUID();

    // 1. Obsługa PDF
    if (isPdf(firstBuf) || first.name.toLowerCase().endsWith(".pdf")) {
      try {
        const { text, pageCount } = await extractTextFromPdf(new Uint8Array(firstBuf));
        if (text.trim().length < MIN_TEXT_CHARS) {
          // Być może to skan PDF bez warstwy tekstowej
          return NextResponse.json(
            {
              error:
                "Plik PDF jest skanem bez warstwy tekstowej lub nie zawiera tekstu. Wykonaj zdjęcie stron lub wklej treść umowy jako tekst.",
            },
            { status: 422 }
          );
        }
        return NextResponse.json({
          text,
          fileName: first.name,
          pageCount,
          fileType: "pdf",
        });
      } catch (pdfErr) {
        log("warn", "Błąd odczytu pliku PDF", { error: String(pdfErr) });
        return NextResponse.json(
          { error: "Nie udało się odczytać pliku PDF. Upewnij się, że plik nie jest uszkodzony ani chroniony hasłem." },
          { status: 422 }
        );
      }
    }

    // 2. Obsługa DOCX
    if (isZipDocx(firstBuf) || first.name.toLowerCase().endsWith(".docx")) {
      try {
        const text = extractTextFromDocx(firstBuf);
        if (text.trim().length < MIN_TEXT_CHARS) {
          return NextResponse.json(
            { error: "Plik DOCX nie zawiera tekstu umowy lub jest pusty." },
            { status: 422 }
          );
        }
        return NextResponse.json({
          text,
          fileName: first.name,
          pageCount: 1,
          fileType: "docx",
        });
      } catch (docxErr) {
        log("warn", "Błąd odczytu pliku DOCX", { error: String(docxErr) });
        return NextResponse.json(
          { error: "Nie udało się odczytać pliku DOCX. Zapisz dokument jako nowy plik DOCX lub PDF." },
          { status: 422 }
        );
      }
    }

    // 3. Obsługa starego formatu .doc (Word 97-2003)
    if (first.name.toLowerCase().endsWith(".doc")) {
      return NextResponse.json(
        {
          error:
            "Format .doc (stary Word) nie jest obsługiwany bezpośrednio. Otwórz plik i zapisz go jako .docx lub .pdf, albo wklej tekst umowy.",
        },
        { status: 422 }
      );
    }

    // 4. Obsługa zdjęć (aparat, skany JPEG, PNG, WEBP)
    const imageCandidates = allFiles.filter((f) => {
      const name = f.name.toLowerCase();
      return (
        f.type.startsWith("image/") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp")
      );
    });

    if (imageCandidates.length > 0) {
      const imageInputs: ImageInput[] = [];
      for (const imgFile of imageCandidates) {
        const buf = Buffer.from(await imgFile.arrayBuffer());
        const imgCheck = isImage(buf);
        const mime = imgCheck.ok ? imgCheck.mime : imgFile.type || "image/jpeg";
        imageInputs.push({
          mimeType: mime,
          dataBase64: buf.toString("base64"),
        });
      }

      try {
        const { text } = await extractTextFromImages(imageInputs, correlationId);
        return NextResponse.json({
          text,
          fileName: first.name,
          pageCount: imageCandidates.length,
          fileType: "image",
        });
      } catch (imgErr: unknown) {
        const message = imgErr instanceof Error ? imgErr.message : "Nie udało się odczytać tekstu ze zdjęć.";
        return NextResponse.json({ error: message }, { status: 422 });
      }
    }

    // 5. Plik czysto tekstowy (.txt)
    try {
      const text = firstBuf.toString("utf-8");
      if (text.trim().length < MIN_TEXT_CHARS) {
        return NextResponse.json(
          { error: "Plik tekstowy zawiera za mało tekstu do rzetelnej analizy." },
          { status: 422 }
        );
      }
      return NextResponse.json({
        text,
        fileName: first.name,
        pageCount: 1,
        fileType: "txt",
      });
    } catch {
      return NextResponse.json(
        { error: "Nieobsługiwany format pliku. Obsługujemy pliki PDF, DOCX, TXT oraz zdjęcia stron (JPG, PNG)." },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    log("error", "Krytyczny błąd trasy /api/extract", { error: String(err) });
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd podczas odczytu pliku." },
      { status: 500 }
    );
  }
}
