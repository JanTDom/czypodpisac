import { NextRequest, NextResponse } from "next/server";
import { PipelineOrchestrator } from "../../../pipeline/orchestrator";
import { LegalKnowledgeBase } from "../../../kb";
import { ChecklistRegistry } from "../../../checklists/registry";
import { MAX_CONTRACT_CHARS, looksLikePlaceholder, rateLimit } from "../../../lib/request-guards";
import { getP24Config, computeSha256, verifyPaymentToken } from "../../../payments/p24";

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

    // Weryfikacja tokenu płatności (odblokowanie pełnego raportu)
    let isFullyUnlocked = false;
    if (body.paymentToken && typeof body.paymentToken === "string") {
      const p24Config = getP24Config();
      if (p24Config) {
        const docHash = computeSha256(contractText);
        isFullyUnlocked = verifyPaymentToken(body.paymentToken, docHash, p24Config.paymentSecret);
      }
    }

    if (isPaid && !isFullyUnlocked) {
      return NextResponse.json(
        { error: "Brak ważnego potwierdzenia płatności za pełny raport." },
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
