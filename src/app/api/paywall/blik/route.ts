import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blikCode, email, analysisId } = body;

    const cleanCode = (blikCode || "").replace(/\s+/g, "");

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return NextResponse.json(
        { error: "Nieprawidłowy 6-cyfrowy kod BLIK." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Podaj prawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    // Sukces autoryzacji płatności BLIK (symulacja bramki Stripe / Tpay / BLIK)
    return NextResponse.json({
      success: true,
      analysisId: analysisId || "analysis-unlocked",
      email,
      amountPln: 39,
      paidAt: new Date().toISOString(),
      transactionId: `blik_tx_${Date.now()}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Błąd przetwarzania płatności BLIK." },
      { status: 500 }
    );
  }
}
