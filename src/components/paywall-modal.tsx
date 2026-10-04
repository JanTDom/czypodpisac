"use client";

import React, { useState } from "react";
import { X, Check, Shield, FileText, Mail, Download, ArrowRight, Loader2, CreditCard } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentToken: string) => void;
  documentTitle?: string;
  documentHash?: string;
  totalFindingsCount?: number;
}

export function PaywallModal({
  isOpen,
  onClose,
  documentHash = "",
  totalFindingsCount = 5,
}: PaywallModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleP24Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Podaj prawidłowy adres e-mail do wysyłki potwierdzenia transakcji.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/payments/p24/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentHash: documentHash || "doc-hash-placeholder",
          email,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Płatności online są chwilowo niedostępne.");
      }

      if (data.paymentUrl) {
        // Bezpośrednie przekierowanie do bezpiecznej bramki Przelewy24
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Nie otrzymano adresu płatności z Przelewy24.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wystąpił błąd podczas łączenia z Przelewy24.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij okno płatności"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 mb-2">
            Pełny raport i bezpieczne negocjacje
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Odblokuj pełną analizę umowy
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Jednorazowa opłata przez Przelewy24 (BLIK, karta, szybki przelew). Bez subskrypcji.
          </p>
        </div>

        <div className="my-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-left text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Pełna lista ryzyk (wszystkie {totalFindingsCount} wykrytych uwag)</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Gotowe nowe brzmienie zapisów (wersja uprzejma i stanowcza)</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Gotowy mail negocjacyjny do drugiej strony</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-slate-600 shrink-0" />
            <span>Eksport do pliku DOCX ze śledzeniem zmian oraz PDF</span>
          </div>
        </div>

        <form onSubmit={handleP24Submit} className="space-y-4 text-left">
          <div>
            <label htmlFor="p24-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Twój adres e-mail (do potwierdzenia i kopii raportu)
            </label>
            <input
              id="p24-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj.mail@domena.pl"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <span className="text-2xl font-black text-slate-900">29,00 zł</span>
              <span className="ml-1 text-xs text-slate-500">brutto</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Łączenie z Przelewy24...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Płacę z Przelewy24 / BLIK
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>Bezpieczne płatności obsługiwane przez Przelewy24 (PayPro SA)</span>
        </div>
      </div>
    </div>
  );
}
