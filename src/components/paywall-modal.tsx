"use client";

import React, { useState } from "react";
import { X, Check, Shield, FileText, Mail, Download, ArrowRight, Loader2 } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentTitle?: string;
  totalFindingsCount?: number;
}

export function PaywallModal({
  isOpen,
  onClose,
  onSuccess,
  totalFindingsCount = 5,
}: PaywallModalProps) {
  const [step, setStep] = useState<"code" | "confirming" | "success">("code");
  const [blikCode, setBlikCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBlikSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = blikCode.replace(/\s+/g, "");
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      setError("Wpisz poprawny 6-cyfrowy kod BLIK z aplikacji banku.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Podaj adres e-mail, na który wyślemy potwierdzenie i kopię raportu.");
      return;
    }

    setError(null);
    setStep("confirming");

    // Symulacja autoryzacji w aplikacji bankowej (ok. 2.5 sekundy)
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij okno płatności"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {step === "code" && (
          <div>
            <div className="text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 mb-2">
                Pełny raport i projekt zmian
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Odblokuj pełną analizę umowy
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Płatność jednorazowa za ten dokument. Bez ukrytych subskrypcji.
              </p>
            </div>

            <div className="my-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-left text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Wszystkie uwagi i pułapki prawne (pełna lista, nie tylko 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Gotowe nowe brzmienie zapisów (wersja uprzejma i stanowcza)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600 shrink-0" />
                <span>Gotowy szablon maila do drugiej strony z paragrafami</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-slate-700 shrink-0" />
                <span>Pobieranie DOCX ze śledzeniem zmian oraz raportu PDF</span>
              </div>
            </div>

            <div className="mb-6 flex items-baseline justify-between border-y border-slate-100 py-3 text-left">
              <div>
                <span className="text-sm font-semibold text-slate-900">Kwota do zapłaty</span>
                <p className="text-[10px] text-slate-400">Jednorazowy dostęp, faktura VAT na życzenie</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">39 zł</span>
                <span className="text-xs text-slate-500 ml-1">brutto</span>
              </div>
            </div>

            <form onSubmit={handleBlikSubmit} className="space-y-4 text-left">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="blik-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Twój adres e-mail (do zapisu raportu i logowania)
                </label>
                <input
                  id="blik-email"
                  type="email"
                  required
                  placeholder="twoj@email.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="blik-code-input" className="block text-xs font-semibold text-slate-700">
                    6-cyfrowy kod BLIK
                  </label>
                  <span className="text-[11px] font-bold text-red-600 tracking-wider">BLIK</span>
                </div>
                <input
                  id="blik-code-input"
                  type="text"
                  maxLength={7}
                  inputMode="numeric"
                  required
                  placeholder="000 000"
                  value={blikCode}
                  onChange={(e) => setBlikCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-bold text-white shadow hover:bg-blue-800 transition"
              >
                Zapłać 39 zł BLIK i odblokuj raport
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Szyfrowane połączenie SSL • Autoryzacja w Twojej aplikacji bankowej</span>
            </div>
          </div>
        )}

        {step === "confirming" && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700 mb-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Potwierdź płatność w telefonie</h3>
            <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
              Otwórz aplikację swojego banku i zatwierdź transakcję BLIK na kwotę 39 zł.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center animate-in fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Płatność potwierdzona!</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pełny raport, poprawki i mail negocjacyjny zostały odblokowane.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
