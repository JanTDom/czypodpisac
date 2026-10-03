"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Camera, FileText, ShieldCheck, Clock, Lock } from "lucide-react";
import { MultiPageCamera, CapturedPage } from "./multi-page-camera";

export interface ContractSubmission {
  file?: File;
  text?: string;
  pages?: CapturedPage[];
  fileName: string;
}

interface StartHeroProps {
  onSubmit: (submission: ContractSubmission) => void;
  isLoading?: boolean;
}

export function StartHero({ onSubmit, isLoading }: StartHeroProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSubmit({
        file,
        fileName: file.name,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSubmit({
        file,
        fileName: file.name,
      });
    }
  };

  const handlePastedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText.trim().length > 30) {
      onSubmit({
        text: pastedText,
        fileName: "wklejona_umowa.txt",
      });
    }
  };

  const handleCameraComplete = (pages: CapturedPage[]) => {
    const combinedText = pages.map((p) => `--- Strona ${p.pageNumber} ---\n${p.name}`).join("\n\n");
    onSubmit({
      text: combinedText,
      pages,
      fileName: `skan_umowy_${pages.length}_stron.pdf`,
    });
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Widok robienia zdjęć aparatem (jeśli aktywny) */}
        {isCameraActive ? (
          <MultiPageCamera
            onComplete={handleCameraComplete}
            onCancel={() => setIsCameraActive(false)}
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Nagłówek startowy — dokładnie wg reguły 01 */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Czy podpisać tę umowę?
            </h1>
            <p className="mt-3 text-base text-slate-600 sm:text-lg max-w-xl">
              Wrzuć dokument lub zrób zdjęcie. W minutę sprawdzisz pułapki prawne, limity finansowe i gotowe poprawki.
            </p>

            {/* Jedno główne pole uploadu — powyżej linii przewijania */}
            <div className="mt-8 w-full max-w-2xl">
              {!isPasteActive ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all ${
                    dragOver
                      ? "border-blue-600 bg-blue-50/50 scale-[1.01]"
                      : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                    id="contract-file-upload"
                  />

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700 mb-4">
                    <UploadCloud className="h-8 w-8" aria-hidden="true" />
                  </div>

                  <p className="text-base font-semibold text-slate-900 sm:text-lg">
                    Wklej treść umowy
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md">
                    Na razie czytamy tylko tekst: wklejony albo z pliku .txt. Zdjęcia, PDF i DOCX wkrótce.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:rounded-xl"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Wybierz plik .txt
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPasteActive(true)}
                    className="mt-4 text-xs font-medium text-slate-500 hover:text-blue-700 underline underline-offset-4"
                  >
                    albo wklej treść umowy jako tekst
                  </button>
                </div>
              ) : (
                /* Formularz wklejania tekstu */
                <form
                  onSubmit={handlePastedSubmit}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-700" />
                      Wklej treść umowy
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPasteActive(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Wróć do wyboru pliku
                    </button>
                  </div>

                  <label htmlFor="pasted-contract-textarea" className="sr-only">
                    Treść umowy
                  </label>
                  <textarea
                    id="pasted-contract-textarea"
                    rows={8}
                    required
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Wklej tutaj tekst umowy (np. § 1. Przedmiot umowy...)"
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Znaki: {pastedText.length}
                    </span>
                    <button
                      type="submit"
                      disabled={pastedText.trim().length < 30 || isLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
                    >
                      Sprawdź tę umowę
                    </button>
                  </div>
                </form>
              )}

              {/* Trzy zdania zaufania — bezwzględny wymóg reguły 01 */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-3.5 shadow-2xs">
                  <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">Dane w UE</p>
                    <p className="text-slate-500 mt-0.5">Przetwarzanie wyłącznie na serwerach w Unii Europejskiej.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-3.5 shadow-2xs">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">Usuwane po 7 dniach</p>
                    <p className="text-slate-500 mt-0.5">Twoje pliki są automatycznie i trwale kasowane.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 p-3.5 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">Brak trenowania AI</p>
                    <p className="text-slate-500 mt-0.5">Nie trenujemy modeli sztucznej inteligencji na Twoich umowach.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
