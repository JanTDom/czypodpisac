"use client";

import React, { useState } from "react";
import { Cpu, Clock, MessageSquareWarning, Scale, AlertCircle } from "lucide-react";

export interface AdminActRow {
  id: string;
  title: string;
  /** Np. "Dz.U. 2026 poz. 880"; null, gdy rejestr nie ma potwierdzonego tekstu jednolitego. */
  unifiedText: string | null;
}

export interface AdminFreshness {
  checkedAt: string;
  totalAudited: number;
  upToDateCount: number;
  needsReviewCount: number;
  repealedCount: number;
}

export interface AdminModels {
  configured: boolean;
  region: string;
  fastModel: string;
  flagshipModel: string;
  verifierModel: string;
}

interface AdminDashboardProps {
  initialDisputes?: Array<{
    id: string;
    findingId: string;
    reason: string;
    contractType?: string;
    createdAt: string;
  }>;
  acts: AdminActRow[];
  freshness: AdminFreshness | null;
  models: AdminModels;
}

type Tab = "models" | "metrics" | "disputes" | "kb";

/**
 * Panel pokazuje wyłącznie dane z konfiguracji, rejestru aktów i plików audytu.
 * Kosztów i czasów aplikacja jeszcze nie mierzy, więc panel ich nie podaje (zakaz zmyślania, B4).
 */
export function AdminDashboard({ initialDisputes = [], acts, freshness, models }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("models");

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "models", label: "Modele Gemini", icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: "metrics", label: "Koszty i czasy", icon: <Clock className="h-3.5 w-3.5" /> },
    {
      id: "disputes",
      label: `Zakwestionowane uwagi (${initialDisputes.length})`,
      icon: <MessageSquareWarning className="h-3.5 w-3.5" />,
    },
    { id: "kb", label: "Baza prawna", icon: <Scale className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 text-left">
      <div className="border-b border-slate-200 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Narzędzia wewnętrzne czypodpisac.pl
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Panel administratora</h1>
          <p className="text-xs text-slate-600 mt-1">
            Konfiguracja modeli, zgłoszenia użytkowników i stan bazy prawnej.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            models.configured
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-amber-50 border-amber-300 text-amber-900"
          }`}
        >
          {models.configured
            ? `Vertex AI skonfigurowany (${models.region}), połączenia nie sprawdzano`
            : "Vertex AI nieskonfigurowany (brak GCP_PROJECT_ID)"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-8" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === t.id ? "bg-blue-700 text-white shadow-2xs" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "models" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-3">Modele z konfiguracji (src/config/models.ts)</h3>
          <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-[12rem_1fr]">
            <dt className="text-slate-600">Klasyfikacja, segmentacja</dt>
            <dd className="font-mono text-slate-900">{models.fastModel}</dd>
            <dt className="text-slate-600">Ocena i poprawki</dt>
            <dd className="font-mono text-slate-900">{models.flagshipModel}</dd>
            <dt className="text-slate-600">Weryfikator</dt>
            <dd className="font-mono text-slate-900">{models.verifierModel}</dd>
            <dt className="text-slate-600">Region</dt>
            <dd className="font-mono text-slate-900">{models.region}</dd>
          </dl>
          <p className="mt-4 text-slate-600">
            Ceny modeli nie są tu podawane. Aktualny cennik jest w dokumentacji Vertex AI.
          </p>
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-xs text-slate-700 flex gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-slate-500" />
          <p>
            Brak pomiarów. Aplikacja nie zapisuje jeszcze kosztu ani czasu analiz, więc nie ma czego pokazać.
            Liczby pojawią się tu, gdy powstanie zapis metryk z rzeczywistych wywołań.
          </p>
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-slate-900">Zgłoszenia użytkowników („Nie zgadzam się”)</h3>
            <span className="text-xs text-slate-600">
              Trzymane w pamięci procesu: znikają po restarcie serwera (B13).
            </span>
          </div>

          {initialDisputes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-600">
              Brak zgłoszeń od ostatniego uruchomienia serwera.
            </div>
          ) : (
            <div className="space-y-3">
              {initialDisputes.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Id uwagi: {d.findingId}</span>
                    <span>{new Date(d.createdAt).toLocaleString("pl-PL")}</span>
                  </div>
                  <p className="font-semibold text-slate-900">„{d.reason}”</p>
                  <span className="inline-block rounded bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 text-[11px] font-bold">
                    Oczekuje na przegląd prawnika
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "kb" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-xs">
            <h3 className="font-bold text-sm text-slate-900">Ostatni audyt aktualności przepisów</h3>
            {freshness ? (
              <>
                <p className="text-slate-600 mt-1">
                  Wynik scripts/check-law-updates.ts z {new Date(freshness.checkedAt).toLocaleString("pl-PL")}.
                  Synchronizacja nie jest automatyczna: skrypt trzeba uruchomić ręcznie.
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <li><span className="block text-slate-600">Sprawdzone przepisy</span><b className="text-lg">{freshness.totalAudited}</b></li>
                  <li><span className="block text-slate-600">Aktualne</span><b className="text-lg">{freshness.upToDateCount}</b></li>
                  <li><span className="block text-slate-600">Do przeglądu</span><b className="text-lg text-amber-800">{freshness.needsReviewCount}</b></li>
                  <li><span className="block text-slate-600">Uchylone</span><b className="text-lg">{freshness.repealedCount}</b></li>
                </ul>
              </>
            ) : (
              <p className="text-slate-600 mt-1">Brak pliku docs/eval/law-freshness-audit.json. Audytu nie uruchomiono.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900">Akty rdzenia (warstwa A): {acts.length}</h3>
            <p className="text-xs text-slate-600 mb-4">Tekst jednolity według src/kb/core-acts-registry.ts.</p>
            <div className="divide-y divide-slate-100">
              {acts.map((act) => (
                <div key={act.id} className="py-2.5 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-800">{act.title}</span>
                  <span className={act.unifiedText ? "text-slate-700" : "text-amber-800 font-semibold"}>
                    {act.unifiedText ?? "brak tekstu jednolitego w rejestrze"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
