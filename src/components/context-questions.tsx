"use client";

import React, { useEffect, useRef, useState } from "react";
import { HelpCircle, Check } from "lucide-react";
import { ContextQuestion } from "../pipeline/schemas/stage02-classification";

interface ContextQuestionsProps {
  questions: ContextQuestion[];
  onAnswer: (answers: Record<string, string>) => void;
}

export function ContextQuestionsModal({ questions, onAnswer }: ContextQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleSelect = (questionId: string, value: string) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

  };

  const allAnswered = questions.length > 0 && questions.every((question) => Boolean(answers[question.id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="context-questions-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="context-questions-title" className="text-base font-bold text-slate-900">
              {questions.length === 1 ? "Jedno pytanie doprecyzowujące" : `${questions.length} pytania doprecyzowujące`}
            </h2>
            <p className="text-xs text-slate-500">
              Odpowiedź pozwala precyzyjnie zastosować właściwe przepisy chroniące Twoją stronę.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {questions.map((q) => {
            const currentAnswer = answers[q.id];

            return (
              <div key={q.id} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                  {q.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {q.options.map((opt) => {
                    const isSelected = currentAnswer === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(q.id, opt.value)}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs font-medium transition-all ${
                          isSelected
                            ? "border-blue-700 bg-blue-50/70 text-blue-900 ring-2 ring-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => onAnswer(answers)}
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          Pokaż wynik analizy
        </button>
      </div>
    </div>
  );
}
