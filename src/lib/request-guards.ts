import { NextRequest, NextResponse } from "next/server";

/** Maksymalna długość tekstu umowy (ok. 100 stron). Dłuższe żądania są odrzucane (B9). */
export const MAX_CONTRACT_CHARS = 200_000;
/** Minimalna długość: krótszy tekst to nie umowa, tylko np. podpisy stron ze zdjęć (B1). */
export const MIN_CONTRACT_CHARS = 200;

/**
 * Prosty limit żądań na adres IP w oknie czasowym (B9).
 * Działa w pamięci jednej instancji serwera. Na Vercel każda instancja liczy osobno,
 * więc to zabezpieczenie podstawowe, a nie pełna ochrona przed nadużyciami.
 */
const buckets = new Map<string, number[]>();

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export function rateLimit(req: NextRequest, scope: string, limit: number, windowMs = 60_000): NextResponse | null {
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return NextResponse.json(
      { error: "Za dużo prób w krótkim czasie. Spróbuj ponownie za minutę." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } }
    );
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear();
  return null;
}

/** Test pomocniczy: czyści liczniki. */
export function __resetRateLimits(): void {
  buckets.clear();
}

/**
 * Teksty, które interfejs wysyłał zamiast treści umowy: z aparatu („Strona 1”)
 * albo z pliku binarnego. Takiej treści nie wolno oceniać (B1).
 */
export function looksLikePlaceholder(text: string): boolean {
  const t = text.trim();
  if (/^\[Dokument binarny/i.test(t)) return true;
  if (t.startsWith("%PDF-")) return true;
  if (t.startsWith("PK\u0003\u0004")) return true;
  const withoutPageLabels = t.replace(/\[?\s*Strona\s+\d+[^\n]*\]?/gi, "").trim();
  return withoutPageLabels.length < MIN_CONTRACT_CHARS;
}
