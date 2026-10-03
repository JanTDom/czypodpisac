import { NextRequest, NextResponse } from "next/server";
import { PipelineOrchestrator } from "../../../pipeline/orchestrator";
import { LegalKnowledgeBase } from "../../../kb";
import { ChecklistRegistry } from "../../../checklists/registry";
import { MAX_CONTRACT_CHARS, looksLikePlaceholder, rateLimit } from "../../../lib/request-guards";

const kb = LegalKnowledgeBase.getInstance();
const registry = ChecklistRegistry.getInstance();
const orchestrator = new PipelineOrchestrator(kb, registry);

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "analyze", 10);
  if (limited) return limited;

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_CONTRACT_CHARS * 4) {
    return NextResponse.json({ error: "Umowa jest za długa do analizy." }, { status: 413 });
  }

  try {
    const body = await req.json();
    const { contractText, fileName, userProvidedAnswers, isPaid } = body ?? {};

    if (!contractText || typeof contractText !== "string" || contractText.trim().length === 0) {
      return NextResponse.json({ error: "Brak treści umowy do analizy." }, { status: 400 });
    }
    if (contractText.length > MAX_CONTRACT_CHARS) {
      return NextResponse.json({ error: "Umowa jest za długa do analizy." }, { status: 413 });
    }
    if (looksLikePlaceholder(contractText)) {
      return NextResponse.json(
        {
          error:
            "Nie widzimy treści umowy. Na razie czytamy tylko wklejony tekst lub plik .txt. Skopiuj treść umowy i wklej ją.",
        },
        { status: 422 }
      );
    }

    // B7: płatny raport tylko po potwierdzonej płatności. Bramka płatności nie jest
    // jeszcze podłączona, więc serwer nie wydaje płatnej części nikomu.
    if (isPaid) {
      return NextResponse.json(
        { error: "Płatny raport nie jest jeszcze dostępny." },
        { status: 402 }
      );
    }

    const fastResult = await orchestrator.runFastVerdict({
      contractText,
      fileName: typeof fileName === "string" && fileName ? fileName : "umowa.txt",
      userProvidedAnswers,
    });

    return NextResponse.json(fastResult, { status: 200 });
  } catch (error) {
    console.error("Błąd pipeline'u analizy:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Wystąpił błąd podczas analizy dokumentu." }, { status: 500 });
  }
}
