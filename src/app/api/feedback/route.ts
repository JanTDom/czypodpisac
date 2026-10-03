import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../../lib/request-guards";

// W pamięci podręcznej zbieramy sygnały jakości i opinie użytkowników do panelu admina
export const feedbackStore: Array<{
  id: string;
  findingId: string;
  reason: string;
  contractType?: string;
  createdAt: string;
  status: "new" | "reviewed" | "dismissed";
}> = [];

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "feedback", 10);
  if (limited) return limited;
  try {
    const body = await req.json();
    const { findingId, reason, contractType } = body;

    if (!findingId || !reason || typeof findingId !== "string" || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Wymagany findingId oraz uzasadnienie." },
        { status: 400 }
      );
    }

    const item = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      findingId: findingId.slice(0, 200),
      reason: reason.slice(0, 2000),
      contractType: typeof contractType === "string" ? contractType.slice(0, 100) : undefined,
      createdAt: new Date().toISOString(),
      status: "new" as const,
    };

    feedbackStore.push(item);

    return NextResponse.json({ success: true, feedbackId: item.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Nie udało się zapisać opinii." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    total: feedbackStore.length,
    items: feedbackStore,
  });
}
