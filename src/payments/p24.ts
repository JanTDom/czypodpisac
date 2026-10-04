import * as crypto from "node:crypto";
import { log } from "../lib/logger";

export interface P24Config {
  merchantId: number;
  posId: number;
  crc: string;
  apiKey: string;
  sandbox: boolean;
  priceGrosze: number;
  baseUrl: string;
  paymentSecret: string;
}

export function getP24Config(): P24Config | null {
  const merchantIdStr = process.env.P24_MERCHANT_ID;
  const posIdStr = process.env.P24_POS_ID || merchantIdStr;
  const crc = process.env.P24_CRC;
  const apiKey = process.env.P24_API_KEY;
  const sandbox = process.env.P24_SANDBOX !== "false";
  const priceStr = process.env.PRICE_PER_DOCUMENT_GROSZE || "2900"; // 29,00 zł
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3001";
  const paymentSecret = process.env.PAYMENT_TOKEN_SECRET || "default_dev_secret_change_in_prod";

  if (!merchantIdStr || !crc || !apiKey) {
    return null;
  }

  const merchantId = parseInt(merchantIdStr, 10);
  const posId = parseInt(posIdStr || merchantIdStr, 10);
  const priceGrosze = parseInt(priceStr, 10);

  if (isNaN(merchantId) || isNaN(posId) || isNaN(priceGrosze)) {
    return null;
  }

  return {
    merchantId,
    posId,
    crc,
    apiKey,
    sandbox,
    priceGrosze,
    baseUrl,
    paymentSecret,
  };
}

export function computeSha384(payload: unknown): string {
  const jsonStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHash("sha384").update(jsonStr, "utf-8").digest("hex");
}

export function computeSha256(str: string): string {
  return crypto.createHash("sha256").update(str, "utf-8").digest("hex");
}

/**
 * Pamięć ulotna (w RAM procesu) zweryfikowanych transakcji P24 dla działania bez bazy danych.
 * Przechowuje sessionId -> timestamp weryfikacji.
 */
const verifiedTransactions = new Map<string, { orderId: number; amount: number; verifiedAt: number }>();

export function markTransactionVerified(sessionId: string, orderId: number, amount: number) {
  verifiedTransactions.set(sessionId, {
    orderId,
    amount,
    verifiedAt: Date.now(),
  });
}

export function isTransactionVerified(sessionId: string): boolean {
  const tx = verifiedTransactions.get(sessionId);
  if (!tx) return false;
  // Ważność sesji w pamięci: 2 godziny
  return Date.now() - tx.verifiedAt < 2 * 60 * 60 * 1000;
}

/**
 * Generuje bezstanowy token HMAC autoryzujący dostęp do pełnego raportu dla danej umowy.
 */
export function generatePaymentToken(sessionId: string, documentHash: string, secret: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const data = `${sessionId}:${documentHash}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}:${hmac}`;
}

/**
 * Weryfikuje token HMAC i sprawdza zgodność z hashem sprawdzanego dokumentu.
 */
export function verifyPaymentToken(token: string, documentHash: string, secret: string): boolean {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) return false;
    const [sessionId, tokenDocHash, expiresAtStr, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false; // Wygasł
    }

    if (tokenDocHash !== documentHash) {
      return false; // Inny dokument
    }

    if (!/^[0-9a-fA-F]{64}$/.test(receivedHmac)) {
      return false;
    }

    const data = `${sessionId}:${tokenDocHash}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(data).digest("hex");

    const a = Buffer.from(receivedHmac, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Rejestruje transakcję w Przelewy24 (transaction/register).
 */
export async function registerP24Transaction(
  sessionId: string,
  documentHash: string,
  userEmail: string,
  config: P24Config,
  fetchFn: typeof fetch = fetch
): Promise<{ paymentUrl: string; token: string }> {
  const p24Host = config.sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
  const registerUrl = `${p24Host}/api/v1/transaction/register`;

  const signData = {
    sessionId,
    merchantId: config.merchantId,
    amount: config.priceGrosze,
    currency: "PLN",
    crc: config.crc,
  };
  const sign = computeSha384(signData);

  const payload = {
    merchantId: config.merchantId,
    posId: config.posId,
    sessionId,
    amount: config.priceGrosze,
    currency: "PLN",
    description: "Pełny raport audytu umowy — czypodpisac.pl",
    email: userEmail,
    urlReturn: `${config.baseUrl}/?p24_session=${sessionId}&doc_hash=${documentHash}`,
    urlStatus: `${config.baseUrl}/api/payments/p24/notify`,
    sign,
  };

  const authHeader = "Basic " + Buffer.from(`${config.posId}:${config.apiKey}`).toString("base64");

  const response = await fetchFn(registerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log("error", "Błąd rejestracji w Przelewy24", { status: response.status, body: errorText });
    throw new Error(`Przelewy24 zwróciło błąd (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const token = result?.data?.token;
  if (!token) {
    throw new Error("Brak tokenu transakcji w odpowiedzi Przelewy24.");
  }

  const paymentUrl = `${p24Host}/trnRequest/${token}`;
  return { paymentUrl, token };
}

/**
 * Weryfikuje transakcję w Przelewy24 (transaction/verify).
 */
export async function verifyP24Transaction(
  sessionId: string,
  orderId: number,
  amount: number,
  config: P24Config,
  fetchFn: typeof fetch = fetch
): Promise<boolean> {
  const p24Host = config.sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
  const verifyUrl = `${p24Host}/api/v1/transaction/verify`;

  const signData = {
    sessionId,
    orderId,
    amount,
    currency: "PLN",
    crc: config.crc,
  };
  const sign = computeSha384(signData);

  const payload = {
    merchantId: config.merchantId,
    posId: config.posId,
    sessionId,
    amount,
    currency: "PLN",
    orderId,
    sign,
  };

  const authHeader = "Basic " + Buffer.from(`${config.posId}:${config.apiKey}`).toString("base64");

  const response = await fetchFn(verifyUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log("error", "Błąd weryfikacji w Przelewy24 (verify)", { status: response.status, body: errorText });
    return false;
  }

  const result = await response.json();
  return result?.data?.status === "success";
}
