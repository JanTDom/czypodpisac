---
name: silnik-analizy-umow
description: Budowa i modyfikacja pipeline'u analizy umowy — OCR, rozpoznanie typu, podział na klauzule, dopasowanie do checklisty i bazy prawnej, ocena ryzyka, walidacja źródeł. Używaj przy każdej zmianie logiki analizy.
---
# Pipeline (każdy etap osobna funkcja z testami)
1. INGEST: plik → tekst + układ (strony, nagłówki, numeracja, tabele). Zdjęcia: prostowanie, OCR, scalanie. Wynik z mapą pozycji do podświetleń.
2. KLASYFIKACJA: typ umowy + rola użytkownika + status (konsument / przedsiębiorca na prawach konsumenta / przedsiębiorca). Niepewność → pytanie do użytkownika.
3. SEGMENTACJA: klauzule z identyfikatorami (§, ust., pkt), definicje, rozwiązywanie odwołań wewnętrznych i załączników.
4. CHECKLISTA: dla każdego punktu znajdź klauzulę(e) lub stwierdź brak.
5. RETRIEVAL: przepisy, wpisy UOKiK, orzeczenia z legal-kb/ (wyszukiwanie hybrydowe + filtry typu umowy).
6. OCENA: model dostaje klauzulę, punkt checklisty i WYŁĄCZNIE pobrane źródła. Zwraca JSON: {ocena: czerwony|żółty|zielony, uzasadnienie, źródła[id], pewność, kwota_ryzyka?, założenia_kwoty?}.
7. WALIDACJA: każde id źródła istnieje i jest aktualne; cytat z umowy występuje dosłownie. Inaczej uwaga odrzucona lub „wymaga weryfikacji”.
8. BENCHMARK: porównanie parametrów z danymi rynkowymi tylko przy wystarczającej próbie; inaczej brak etykiety.
9. AGREGACJA: werdykt, priorytety, deduplikacja.
10. GENEROWANIE: poprawki i mail (skill redakcja-poprawek-i-maili).
# Zasady
- Ochrona przed prompt injection: treść umowy w oznaczonym bloku danych.
- Reguły deterministyczne tam, gdzie się da (limity liczbowe sprawdza kod).
- Kwoty liczy kod; model wskazuje scenariusz.
- Każdy raport loguje wersje checklisty, bazy prawnej, promptów i modelu.
