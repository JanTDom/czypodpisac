"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const STAGES = [
  { id: 1, label: "Wczytywanie i podział dokumentu" },
  { id: 2, label: "Rozpoznawanie stron i typu umowy" },
  { id: 3, label: "Wyszukiwanie przepisów w oficjalnej bazie prawa" },
  { id: 4, label: "Audyt limitów finansowych i klauzul abuzywnych" },
  { id: 5, label: "Niezależna weryfikacja poprawności uwag" },
  { id: 6, label: "Przygotowanie jednoznacznego werdyktu" },
];

interface AnalysisProgressProps {
  currentStage?: number;
  onFinish?: () => void;
}

export function AnalysisProgress({ currentStage: propStage }: AnalysisProgressProps) {
  const [activeStage, setActiveStage] = useState(propStage || 1);

  useEffect(() => {
    if (propStage) {
      setActiveStage(propStage);
      return;
    }

    // Automatyczna symulacja postępu krok po kroku
    const interval = setInterval(() => {
      setActiveStage((prev) => {
        if (prev < STAGES.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [propStage]);

  return (
    <div
      aria-live="polite"
      className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-left my-8"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Analizujemy Twoją umowę</h2>
          <p className="text-xs text-slate-500">
            Średni czas badania dokumentu to poniżej 60 sekund.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {STAGES.map((s) => {
          const isDone = activeStage > s.id;
          const isCurrent = activeStage === s.id;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3.5 text-xs transition-opacity duration-300 ${
                isDone || isCurrent ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : isCurrent ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-700 border-t-transparent animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-100" />
                )}
              </div>

              <span
                className={`${
                  isCurrent
                    ? "font-bold text-blue-900"
                    : isDone
                    ? "font-medium text-slate-700"
                    : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-blue-700 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, (activeStage / STAGES.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
