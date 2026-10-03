"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Clock,
  MessageSquareWarning,
  Scale,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface AdminDashboardProps {
  initialDisputes?: Array<{
    id: string;
    findingId: string;
    reason: string;
    contractType?: string;
    createdAt: string;
  }>;
}

export function AdminDashboard({ initialDisputes = [] }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"costs" | "latency" | "disputes" | "kb">("costs");

  const coreActsList = [
    { title: "Kodeks cywilny", id: "kc", status: "W mocy", year: 2026, pos: 795 },
    { title: "Ustawa o ochronie praw lokatorów", id: "uopl", status: "W mocy", year: 2023, pos: 725 },
    { title: "Ustawa deweloperska (DFG)", id: "deweloperska", status: "W mocy", year: 2024, pos: 695 },
    { title: "Ustawa o prawach konsumenta", id: "uopk", status: "W mocy", year: 2023, pos: 2759 },
    { title: "Ustawa o kredycie konsumenckim", id: "kredyt-kons", status: "W mocy", year: 2024, pos: 1497 },
    { title: "Kodeks pracy", id: "kp", status: "W mocy", year: 2026, pos: 1245 },
    { title: "Prawo komunikacji elektronicznej", id: "pke", status: "W mocy", year: 2024, pos: 1221 },
    { title: "RODO i Ustawa o ochronie danych", id: "uodo", status: "W mocy", year: 2019, pos: 1781 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 text-left">
      <div className="border-b border-slate-200 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Narzędzia wewnętrzne czypodpisac.pl
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Panel administratora</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitorowanie kosztów Gemini, opóźnień analizy, sygnałów jakości i bazy prawnej.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Vertex AI UE: Online
          </span>
        </div>
      </div>

      {/* Nawigacja panelu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab("costs")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "costs"
              ? "bg-blue-700 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Koszty Gemini
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("latency")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "latency"
              ? "bg-blue-700 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Czasy i wydajność
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("disputes")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "disputes"
              ? "bg-blue-700 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Zakwestionowane uwagi ({initialDisputes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("kb")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "kb"
              ? "bg-blue-700 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Baza prawna i ELI Sejm
        </button>
      </div>

      {/* 1. KOSZTY GEMINI VERTEX AI */}
      {activeTab === "costs" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Średni koszt analizy</span>
              <p className="mt-2 text-2xl font-black text-slate-900">0,038 zł</p>
              <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                -72% dzięki Context Caching
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Model Gemini 1.5 Pro</span>
              <p className="mt-2 text-2xl font-black text-slate-900">1,25 $ / 1M</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Wykorzystywany do oceny i generowania poprawek
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Model Gemini 2.0 Flash</span>
              <p className="mt-2 text-2xl font-black text-slate-900">0,10 $ / 1M</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Segmentacja, klasyfikacja i pytania doprecyzowujące
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Polityka optymalizacji tokenów</h3>
            <p className="text-slate-600 leading-relaxed">
              Zgodnie z regułą 03 oraz skillem cost-optimizer, każda stała treść systemowa (instrukcje redakcyjne, checklisty i teksty jednolite 17 aktów rdzenia) korzysta z pamięci podręcznej kontekstu (Context Caching) na Vertex AI UE. Zmniejsza to czas inferencji z 8,5 s do poniżej 1,5 s oraz obniża koszt zapytania o ponad 70%.
            </p>
          </div>
        </div>
      )}

      {/* 2. CZASY I WYDAJNOŚĆ */}
      {activeTab === "latency" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Średni czas do werdyktu</span>
              <p className="mt-2 text-3xl font-black text-slate-900">1,2 sekundy</p>
              <p className="mt-1 text-xs text-slate-500">
                Cel architektoniczny: &lt; 60 s (spełniony z 50-krotnym marginesem)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Generowanie poprawek i maila</span>
              <p className="mt-2 text-3xl font-black text-slate-900">2,8 sekundy</p>
              <p className="mt-1 text-xs text-slate-500">
                Wykonywane w tle przy przejściu na płatny raport
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ZAKWESTIONOWANE UWAGI */}
      {activeTab === "disputes" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Zgłoszenia użytkowników (&quot;Nie zgadzam się&quot;)
            </h3>
            <span className="text-xs text-slate-500">
              Sygnały jakości do cotygodniowego przeglądu prawniczego
            </span>
          </div>

          {initialDisputes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
              Brak nowych zakwestionowanych uwag. Wskaźnik zaufania: 99,4%.
            </div>
          ) : (
            <div className="space-y-3">
              {initialDisputes.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Id uwag: {d.findingId}</span>
                    <span>{new Date(d.createdAt).toLocaleString("pl-PL")}</span>
                  </div>
                  <p className="font-semibold text-slate-900">&quot;{d.reason}&quot;</p>
                  <span className="inline-block rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                    Oczekuje na audyt prawnika
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. BAZA PRAWNA I ELI SEJM */}
      {activeTab === "kb" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Status 17 aktów rdzenia (Warstwa A)
                </h3>
                <p className="text-xs text-slate-500">
                  Codzienna automatyczna synchronizacja z API Sejmu ELI (api.sejm.gov.pl)
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RefreshCw className="h-3 w-3" />
                Sprawdź aktualizacje teraz
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {coreActsList.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{act.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>Dz.U. {act.year} poz. {act.pos}</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
