import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/request-guards";

/**
 * Bramka BLIK nie jest podłączona (B7). Endpoint sprawdza dane formularza,
 * ale nigdy nie potwierdza płatności, której nie było.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "blik", 5);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { blikCode, email } = body ?? {};
    const cleanCode = String(blikCode ?? "").replace(/\s+/g, "");

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return NextResponse.json({ error: "Nieprawidłowy 6-cyfrowy kod BLIK." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Podaj prawidłowy adres e-mail." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Płatności nie są jeszcze uruchomione. Nie pobraliśmy żadnych pieniędzy." },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ error: "Błąd przetwarzania płatności BLIK." }, { status: 500 });
  }
}
