import { NextRequest, NextResponse } from "next/server";
import {
  getP24Config,
  isTransactionVerified,
  generatePaymentToken,
} from "../../../../../payments/p24";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const documentHash = searchParams.get("documentHash");

  if (!sessionId || !documentHash) {
    return NextResponse.json(
      { error: "Wymagane parametry: sessionId oraz documentHash." },
      { status: 400 }
    );
  }

  const config = getP24Config();
  if (!config) {
    return NextResponse.json({ error: "Brak konfiguracji płatności." }, { status: 503 });
  }

  const verified = isTransactionVerified(sessionId);
  if (!verified) {
    return NextResponse.json({
      paid: false,
      status: "pending",
      message: "Płatność oczekuje na zaksięgowanie.",
    });
  }

  const paymentToken = generatePaymentToken(sessionId, documentHash, config.paymentSecret);

  return NextResponse.json({
    paid: true,
    status: "verified",
    paymentToken,
  });
}
