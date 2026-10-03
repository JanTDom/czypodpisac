import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as analyze } from "../src/app/api/analyze/route";
import { isAdminAuthorized, middleware } from "../src/middleware";
import { __resetRateLimits, looksLikePlaceholder, MAX_CONTRACT_CHARS } from "../src/lib/request-guards";

const longContract = "§ 1. Wynajmujący oddaje Najemcy lokal mieszkalny do używania. ".repeat(10);

function analyzeReq(body: unknown, ip = "10.0.0.1") {
  return new NextRequest("http://localhost/api/analyze", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Blokery przed wydaniem", () => {
  beforeEach(() => __resetRateLimits());

  it("B1: tekst z aparatu i z pliku binarnego nie dostaje werdyktu", async () => {
    expect(looksLikePlaceholder("[Strona 1]\n[Strona 2]")).toBe(true);
    expect(looksLikePlaceholder("[Dokument binarny: umowa.pdf]")).toBe(true);
    expect(looksLikePlaceholder("%PDF-1.7 ...")).toBe(true);
    expect(looksLikePlaceholder(longContract)).toBe(false);
    const res = await analyze(analyzeReq({ contractText: "Strona 1\nStrona 2" }));
    expect(res.status).toBe(422);
  });

  it("B7: isPaid od klienta nie wydaje płatnej części", async () => {
    const res = await analyze(analyzeReq({ contractText: longContract, isPaid: true }));
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.generation).toBeUndefined();
  });

  it("B8: panel admina bez hasła w konfiguracji zwraca 404, z hasłem wymaga logowania", () => {
    const prev = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    expect(middleware(new NextRequest("http://localhost/admin")).status).toBe(404);
    process.env.ADMIN_PASSWORD = "sekret-testowy";
    expect(middleware(new NextRequest("http://localhost/admin")).status).toBe(401);
    const ok = new NextRequest("http://localhost/admin", {
      headers: { authorization: "Basic " + btoa("admin:sekret-testowy") },
    });
    expect(middleware(ok).status).toBe(200);
    expect(isAdminAuthorized("Basic " + btoa("admin:zle"), "sekret-testowy")).toBe(false);
    expect(middleware(new NextRequest("http://localhost/api/feedback", { method: "POST" })).status).toBe(200);
    expect(middleware(new NextRequest("http://localhost/api/feedback")).status).toBe(401);
    if (prev === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prev;
  });

  it("B9: za długi tekst jest odrzucany", async () => {
    const res = await analyze(analyzeReq({ contractText: "a".repeat(MAX_CONTRACT_CHARS + 1) }));
    expect(res.status).toBe(413);
  });

  it("B9: 11. żądanie w minucie z jednego adresu dostaje 429", async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) {
      last = (await analyze(analyzeReq({ contractText: "" }, "10.0.0.9"))).status;
    }
    expect(last).toBe(429);
  });
});
