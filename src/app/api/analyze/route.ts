import { NextRequest, NextResponse } from "next/server";
import { PipelineOrchestrator } from "../../../pipeline/orchestrator";
import { LegalKnowledgeBase } from "../../../kb";
import { ChecklistRegistry } from "../../../checklists/registry";

// Inicjalizacja instancji singletonów bazy i rejestru
const kb = LegalKnowledgeBase.getInstance();
const registry = ChecklistRegistry.getInstance();
const orchestrator = new PipelineOrchestrator(kb, registry);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractText, fileName, userProvidedAnswers, isPaid } = body;

    if (!contractText || typeof contractText !== "string" || contractText.trim().length === 0) {
      return NextResponse.json(
        { error: "Brak treści umowy do analizy." },
        { status: 400 }
      );
    }

    if (isPaid) {
      // Pełna analiza z generowaniem poprawek i maila
      const fullResult = await orchestrator.runFullPipeline({
        contractText,
        fileName: fileName || "umowa.txt",
        userProvidedAnswers,
      });
      return NextResponse.json(fullResult, { status: 200 });
    }

    // Szybki werdykt darmowy
    const fastResult = await orchestrator.runFastVerdict({
      contractText,
      fileName: fileName || "umowa.txt",
      userProvidedAnswers,
    });

    return NextResponse.json(fastResult, { status: 200 });
  } catch (error: any) {
    console.error("Błąd pipeline'u analizy:", error);
    return NextResponse.json(
      { error: error?.message || "Wystąpił błąd podczas analizy dokumentu." },
      { status: 500 }
    );
  }
}
