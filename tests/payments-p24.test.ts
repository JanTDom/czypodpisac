import { describe, it, expect } from "vitest";
import {
  computeSha384,
  computeSha256,
  generatePaymentToken,
  verifyPaymentToken,
  markTransactionVerified,
  isTransactionVerified,
  registerP24Transaction,
  P24Config,
} from "../src/payments/p24";

describe("Przelewy24 Integration", () => {
  const mockConfig: P24Config = {
    merchantId: 12345,
    posId: 12345,
    crc: "mock_crc_key_789",
    apiKey: "mock_api_key_abc",
    sandbox: true,
    priceGrosze: 2900,
    baseUrl: "http://localhost:3001",
    paymentSecret: "super_secret_hmac_key",
  };

  it("poprawnie generuje hash SHA-384 dla podpisu P24", () => {
    const data = {
      sessionId: "test-session-123",
      merchantId: 12345,
      amount: 2900,
      currency: "PLN",
      crc: "mock_crc_key_789",
    };
    const hash = computeSha384(data);
    expect(hash).toHaveLength(96); // 384 bity = 96 znaków hex
    expect(typeof hash).toBe("string");
  });

  it("generuje i weryfikuje bezstanowy token HMAC dla opłaconego dokumentu", () => {
    const sessionId = "sess-abc";
    const documentHash = computeSha256("Treść przykładowej umowy");
    const secret = "secret_key_123";

    const token = generatePaymentToken(sessionId, documentHash, secret);
    expect(token).toContain(sessionId);
    expect(token).toContain(documentHash);

    // Poprawny token
    const isValid = verifyPaymentToken(token, documentHash, secret);
    expect(isValid).toBe(true);

    // Niepoprawny hash dokumentu (próba użycia tokena do innej umowy)
    const isInvalidDoc = verifyPaymentToken(token, "inny_hash_dokumentu", secret);
    expect(isInvalidDoc).toBe(false);

    // Zły sekret
    const isInvalidSecret = verifyPaymentToken(token, documentHash, "zly_sekret");
    expect(isInvalidSecret).toBe(false);

    // Sfałszowany token
    const isForged = verifyPaymentToken(token + "tampered", documentHash, secret);
    expect(isForged).toBe(false);
  });

  it("zarządza pamięcią zweryfikowanych transakcji (in-memory ledger)", () => {
    const sessionId = "unique-session-xyz";
    expect(isTransactionVerified(sessionId)).toBe(false);

    markTransactionVerified(sessionId, 99999, 2900);
    expect(isTransactionVerified(sessionId)).toBe(true);
  });

  it("rejestruje transakcję P24 i zwraca poprawny paymentUrl", async () => {
    const mockFetch = async (url: string, init?: RequestInit): Promise<Response> => {
      expect(url).toContain("https://sandbox.przelewy24.pl/api/v1/transaction/register");
      const body = JSON.parse(init?.body as string);
      expect(body.merchantId).toBe(12345);
      expect(body.amount).toBe(2900);
      expect(body.sessionId).toBe("sess-register-1");
      expect(body.sign).toBeDefined();

      return new Response(JSON.stringify({ data: { token: "token_p24_from_gateway" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const res = await registerP24Transaction(
      "sess-register-1",
      "mock_doc_hash",
      "klient@test.pl",
      mockConfig,
      mockFetch as unknown as typeof fetch
    );

    expect(res.token).toBe("token_p24_from_gateway");
    expect(res.paymentUrl).toBe("https://sandbox.przelewy24.pl/trnRequest/token_p24_from_gateway");
  });
});
