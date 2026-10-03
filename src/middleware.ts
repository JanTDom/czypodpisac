import { NextRequest, NextResponse } from "next/server";

/**
 * B8: panel admina i lista zgłoszeń tylko po zalogowaniu (HTTP Basic).
 * Hasło w zmiennej ADMIN_PASSWORD. Bez niej panel jest wyłączony (404),
 * żeby brak konfiguracji nigdy nie oznaczał publicznego dostępu.
 */
export const config = {
  matcher: ["/admin/:path*", "/api/feedback"],
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAdminAuthorized(authHeader: string | null, password: string | undefined): boolean {
  if (!password || !authHeader?.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(authHeader.slice(6));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return timingSafeEqual(decoded.slice(sep + 1), password);
}

export function middleware(req: NextRequest) {
  // Zgłoszenie „Nie zgadzam się” (POST) jest publiczne; odczyt listy już nie.
  if (req.nextUrl.pathname === "/api/feedback" && req.method === "POST") {
    return NextResponse.next();
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!isAdminAuthorized(req.headers.get("authorization"), password)) {
    return new NextResponse("Wymagane logowanie", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="czypodpisac-admin", charset="UTF-8"' },
    });
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
