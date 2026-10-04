import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";
import { z } from "zod";
import { getP24Config, registerP24Transaction, computeSha256 } from "../../../../../payments/p24";
import { rateLimit } from "../../../../../lib/request-guards";
import { log } from "../../../../../lib/logger";

const RegisterRequestSchema = z.object({
  contractText: z.string().min(50).optional(),
  documentHash: z.string().min(32).optional(),
  email: z.string().email().default("klient@czypodpisac.pl"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "p24-register", 10);
  if (limited) return limited;

  const config = getP24Config();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Płatności online Przelewy24 są w trakcie konfiguracji produkcyjnej. Pełny raport jest obecnie niedostępny.",
      },
      { status: 503 }
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = RegisterRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane żądania rejestracji płatności." },
        { status: 400 }
      );
    }

    const docHash = parsed.data.documentHash || (parsed.data.contractText ? computeSha256(parsed.data.contractText) : "");
    if (!docHash) {
      return NextResponse.json(
        { error: "Brak identyfikatora dokumentu do powiązania płatności." },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const { paymentUrl, token } = await registerP24Transaction(
      sessionId,
      docHash,
      parsed.data.email,
      config
    );

    return NextResponse.json({
      success: true,
      sessionId,
      paymentUrl,
      token,
      amountGrosze: config.priceGrosze,
    });
  } catch (err: unknown) {
    log("error", "Błąd trasy p24/register", { error: String(err) });
    return NextResponse.json(
      { error: "Nie udało się rozpocząć transakcji w Przelewy24." },
      { status: 500 }
    );
  }
}
