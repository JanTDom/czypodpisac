"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  FileText,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Camera,
  FileCheck,
  UserCheck,
} from "lucide-react";

export type UserRoleSelection = "wykonawca" | "zamawiajacy" | "auto";

export interface ContractSubmission {
  file?: File;
  files?: File[];
  text?: string;
  fileName: string;
  userRole?: UserRoleSelection;
}

interface StartHeroProps {
  onSubmit: (submission: ContractSubmission) => void;
  isLoading?: boolean;
}

export function StartHero({ onSubmit, isLoading }: StartHeroProps) {
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRoleSelection>("wykonawca");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileError(null);

    const files = Array.from(fileList);
    const first = files[0];

    // Sprawdź rozszerzenie
    const name = first.name.toLowerCase();
    const isSupported =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      name.endsWith(".txt") ||
      first.type.startsWith("image/") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp");

    if (!isSupported) {
      setFileError("Obsługujemy pliki PDF, Word (.docx), tekstowe (.txt) oraz zdjęcia stron umowy (JPG, PNG).");
      return;
    }

    if (files.length === 1) {
      onSubmit({ file: first, fileName: first.name, userRole: selectedRole });
    } else {
      onSubmit({ files, fileName: `${files.length} stron umowy`, userRole: selectedRole });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePastedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText.trim().length >= 50) {
      onSubmit({ text: pastedText, fileName: "wklejona_umowa.txt", userRole: selectedRole });
    } else {
      setFileError("Wklejony tekst jest za krótki. Wklej co najmniej kilka zdań lub artykułów umowy.");
    }
  };

  return (
    <section className="hero-grid relative overflow-hidden text-white">
      <div className="hero-orb" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(330px,0.92fr)] md:gap-8 lg:gap-14">
          <div className="soft-enter max-w-2xl text-left">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Rzetelna analiza umowy w minutę
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Czy podpisać tę umowę?
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Wyjaśniamy umowę prosto i po ludzku — jak dla laika. Dostaniesz jasny werdykt, kwoty ryzyka,
              wskazanie pułapek i gotowy wzór maila do drugiej strony.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Wyjaśnienia dla laika (zero żargonu)</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> 4 źródła prawa (Sejm ELI, UOKiK, SN, UE)</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Płatności Przelewy24 / BLIK (KNF)</span>
            </div>

            <div className="logo-stage mt-12 hidden max-w-md items-center gap-4 rounded-2xl p-3 sm:flex">
              <Image
                src="/brand/logo.png"
                alt="czypodpisac.pl"
                width={1536}
                height={1024}
                className="h-auto w-full max-w-[280px] object-contain"
                priority
              />
              <p className="max-w-[145px] text-xs leading-5 text-slate-300">
                Spokojna decyzja zaczyna się od zrozumiałej umowy.
              </p>
            </div>
          </div>

          {/* Panel wgrywania dokumentu */}
          <div className="upload-panel soft-enter rounded-[1.75rem] border border-white/15 bg-[#0d213c] p-5 text-white sm:p-7 text-left" style={{ animationDelay: "80ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-400">Natychmiastowy audyt</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Wgraj umowę</h2>
                <p className="mt-1 text-xs leading-5 text-slate-300">PDF, Word (DOCX), tekst lub zdjęcia stron z telefonu.</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                <ScanText className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            {/* Wybór strony umowy ("Która strona to my") */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#091a31] p-3.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-200">
                W tej umowie reprezentujesz:
              </label>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("wykonawca")}
                  className={`flex flex-col rounded-xl border p-2.5 text-left transition ${
                    selectedRole === "wykonawca"
                      ? "border-cyan-400 bg-cyan-950/70 text-white shadow-sm"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold">Wykonawcę / Najemcę / Kupującego</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Słabsza strona — szukamy pułapek i kar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("zamawiajacy")}
                  className={`flex flex-col rounded-xl border p-2.5 text-left transition ${
                    selectedRole === "zamawiajacy"
                      ? "border-cyan-400 bg-cyan-950/70 text-white shadow-sm"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold">Zleceniodawcę / Wynajmującego</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Zlecający — szukamy ryzyk formalnych i ZUS/PIP</span>
                </button>
              </div>
            </div>

            {!isPasteActive ? (
              <div className="mt-5">
                {/* Ukryte inputy */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  aria-label="Wybierz plik z umową"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="contract-file-upload"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  aria-label="Zrób zdjęcie stron umowy aparatem"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="contract-camera-upload"
                />

                {/* Strefa Drag & Drop */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-5 transition sm:p-6 ${
                    dragOver ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 bg-[#091a31] hover:border-cyan-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200 shadow-sm">
                      <UploadCloud className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Upuść plik umowy tutaj</p>
                      <p className="mt-0.5 text-xs text-slate-400">PDF, Word (DOCX), TXT lub zdjęcia stron</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FileCheck className="h-4 w-4" aria-hidden="true" />
                      Wybierz plik z dysku
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                      Zrób zdjęcie aparatem
                    </button>
                  </div>
                </div>

                {fileError && (
                  <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-xs font-semibold leading-5 text-red-300">
                    {fileError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsPasteActive(true)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-100"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" /> Wklej treść umowy jako tekst
                </button>
              </div>
            ) : (
              <form onSubmit={handlePastedSubmit} className="mt-5">
                <label htmlFor="pasted-contract-textarea" className="mb-2 block text-xs font-bold uppercase tracking-wider text-cyan-200">
                  Wklej treść umowy (np. z maila lub schowka)
                </label>
                <textarea
                  id="pasted-contract-textarea"
                  rows={8}
                  required
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (fileError) setFileError(null);
                  }}
                  placeholder="Np. § 1. Przedmiot umowy... Zleceniobiorca zobowiązuje się do..."
                  className="w-full resize-y rounded-2xl border border-white/15 bg-[#091a31] p-4 text-xs leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                />

                {fileError && (
                  <p role="alert" className="mt-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300">
                    {fileError}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{pastedText.length} znaków</span>
                  <button
                    type="submit"
                    disabled={pastedText.trim().length < 50 || isLoading}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Sprawdź tę umowę <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasteActive(false)}
                  className="mt-3 min-h-11 text-xs font-semibold text-slate-300 underline decoration-slate-500 underline-offset-4 hover:text-white"
                >
                  Wróć do wyboru pliku
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
              Analiza ma charakter informacyjny i edukacyjny. Nie stanowi porady radcy prawnego ani adwokata.
            </p>
          </div>
        </div>

        {/* Prawdziwe gwarancje prywatności i operator płatności */}
        <div id="gwarancje" className="mt-14 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 text-left">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Przetwarzanie w UE"
            text="Serwery i algorytmy działają wyłącznie w europejskiej strefie prawnej RODO."
          />
          <TrustItem
            icon={<FileCheck className="h-5 w-5" />}
            title="Zero zapisu na dyskach"
            text="Analiza odbywa się w ulotnej pamięci RAM. Dokument znika natychmiast po audycie."
          />
          <TrustItem
            icon={<Sparkles className="h-5 w-5" />}
            title="Brak trenowania AI"
            text="Twoje prywatne umowy i dane nigdy nie posłużą do uczenia modeli."
          />
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Przelewy24 / BLIK"
            text="Licencjonowany operator PayPro S.A. pod bezpośrednim nadzorem KNF (IP24/2014)."
          />
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="trust-item flex items-start gap-3 rounded-2xl p-4 bg-[#091a31]/60 border border-white/10">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-300">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{text}</p>
      </div>
    </div>
  );
}
