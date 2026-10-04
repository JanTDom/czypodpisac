import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";
import { z } from "zod";
import {
  getP24Config,
  computeSha384,
  verifyP24Transaction,
  markTransactionVerified,
} from "../../../../../payments/p24";
import { log } from "../../../../../lib/logger";

const P24NotifySchema = z.object({
  merchantId: z.number(),
  posId: z.number(),
  sessionId: z.string(),
  amount: z.number(),
  originAmount: z.number().optional(),
  currency: z.string(),
  orderId: z.number(),
  methodId: z.number().optional(),
  statement: z.string().optional(),
  sign: z.string(),
});

export async function POST(req: NextRequest) {
  const config = getP24Config();
  if (!config) {
    return NextResponse.json({ error: "Brak konfiguracji Przelewy24." }, { status: 503 });
  }

  try {
    const rawBody = await req.json();
    const parsed = P24NotifySchema.safeParse(rawBody);

    if (!parsed.success) {
      log("warn", "Niepoprawny format powiadomienia P24", { errorCount: parsed.error.issues.length });
      return NextResponse.json({ error: "Nieprawidłowy payload" }, { status: 400 });
    }

    const { sessionId, orderId, amount, currency, sign } = parsed.data;

    // 1. Sprawdzenie podpisu SHA-384
    const expectedSignData = {
      sessionId,
      orderId,
      amount,
      currency,
      crc: config.crc,
    };
    const expectedSign = computeSha384(expectedSignData);

    const receivedBuf = Buffer.from(sign, "hex");
    const expectedBuf = Buffer.from(expectedSign, "hex");

    if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      log("warn", "Błędny podpis powiadomienia P24", { sessionId, orderId });
      return NextResponse.json({ error: "Nieprawidłowy podpis transakcji" }, { status: 400 });
    }

    // 2. Potwierdzenie transakcji w bramce P24 (transaction/verify)
    const isVerified = await verifyP24Transaction(sessionId, orderId, amount, config);
    if (!isVerified) {
      log("error", "Bramka P24 odrzuciła weryfikację transakcji", { sessionId, orderId });
      return NextResponse.json({ error: "Weryfikacja w P24 nie powiodła się" }, { status: 400 });
    }

    // 3. Zapisanie zweryfikowanej transakcji w pamięci podręcznej RAM
    markTransactionVerified(sessionId, orderId, amount);
    log("info", "Transakcja P24 pomyślnie zweryfikowana", { sessionId, orderId, amount });

    return NextResponse.json({ status: "OK" });
  } catch (err: unknown) {
    log("error", "Błąd przetwarzania powiadomienia P24 notify", { error: String(err) });
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
