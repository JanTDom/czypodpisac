"use client";

import React, { useState, useRef } from "react";
import { Camera, Plus, Trash2, ArrowLeft, ArrowRight, RotateCcw, Check } from "lucide-react";

export interface CapturedPage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  name: string;
}

interface MultiPageCameraProps {
  onComplete: (pages: CapturedPage[]) => void;
  onCancel: () => void;
}

export function MultiPageCamera({ onComplete, onCancel }: MultiPageCameraProps) {
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPages((prev) => [
          ...prev,
          {
            id: `page-${Date.now()}-${index}`,
            pageNumber: prev.length + 1,
            dataUrl,
            name: `Strona ${prev.length + 1}`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset wejścia dla kolejnych zdjęć
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Strona ${idx + 1}` }));
    });
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const [moved] = newPages.splice(index, 1);
    newPages.splice(targetIndex, 0, moved);

    setPages(newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1, name: `Strona ${idx + 1}` })));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Aparat wielostronicowy</h2>
          <p className="text-xs text-slate-500">
            Zrób zdjęcia kolejnych stron umowy. Możesz zmieniać ich kolejność i powtarzać nieczytelne ujęcia.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:rounded"
        >
          Anuluj
        </button>
      </div>

      {/* Ukryte pole aparatu dla telefonu / komputera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCapture}
        className="hidden"
        id="camera-input"
      />

      {/* Podgląd wykonanych zdjęć */}
      <div className="my-6">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
            <div className="rounded-full bg-blue-50 p-4 text-blue-600 mb-3">
              <Camera className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Brak zrobionych stron</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Naciśnij przycisk poniżej, aby otworzyć aparat i sfotografować pierwszą stronę umowy.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm"
            >
              <Camera className="h-4 w-4" />
              Zrób zdjęcie strony 1
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Liczba sfotografowanych stron: {pages.length}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Dodaj kolejną stronę ({pages.length + 1})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="group relative flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-sm"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.dataUrl}
                      alt={`Podgląd ${page.name}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {page.name}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => movePage(index, "left")}
                        aria-label={`Przesuń stronę ${index + 1} w lewo`}
                        className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pages.length - 1}
                        onClick={() => movePage(index, "right")}
                        aria-label={`Przesuń stronę ${index + 1} w prawo`}
                        className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      aria-label={`Usuń stronę ${index + 1}`}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pages.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setPages([])}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Wyczyść wszystkie strony
          </button>

          <button
            type="button"
            onClick={() => onComplete(pages)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow"
          >
            <Check className="h-4 w-4" />
            Przejdź do analizy ({pages.length} {pages.length === 1 ? "strona" : "stron"})
          </button>
        </div>
      )}
    </div>
  );
}
