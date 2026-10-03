# ADR 0002: Dekompozycja pipeline'u analizy umowy na 10 niezależnych etapów

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Powszechnym anty-wzorcem w systemach analizy prawnej opartych na LLM jest próba wykonania całej analizy w pojedynczym zapytaniu („jeden wielki prompt”). Prowadzi to do:
- Poważnych halucynacji prawnych (zmyślanie artykułów i orzeczeń),
- Niestabilności struktury wyjściowej (trudność w parsowaniu JSON),
- Braku możliwości weryfikacji i debugowania poszczególnych kroków rozumowania,
- Wysokiej podatności na ataki prompt injection ukryte w treści umowy,
- Braku możliwości wdrożenia deterministycznych reguł matematycznych (np. limitów ustawowych kaucji).

## Decyzja
Pipeline analizy zostaje podzielony na 10 ściśle rozgraniczonych etapów funkcyjnych. Każdy etap posiada dedykowany kontrakt wejścia i wyjścia zdefiniowany schematem Zod:
1. `stage01-ingest`: konwersja pliku na tekst, układ stron i mapę współrzędnych.
2. `stage02-classification`: identyfikacja typu umowy, roli stron i ew. maks. 3 pytań kontekstowych.
3. `stage03-segmentation`: wyodrębnienie klauzul (§, ust., pkt) i powiązań.
4. `stage04-checklist`: deterministyczne przypisanie klauzul do checklisty i detekcja braków.
5. `stage05-retrieval`: wyszukiwanie hybrydowe w `legal-kb/` dla powiązanych punktów checklisty.
6. `stage06-evaluation`: izolowana ocena klauzuli przez LLM z dostępem WYŁĄCZNIE do pobranych jednostek prawnych.
7. `stage07-validation`: deterministyczny audyt kodu — sprawdzenie istnienia ID źródła w KB i dosłowności cytatu.
8. `stage08-benchmark`: porównanie parametrów umowy z bazą rynkową przy zachowaniu progu minimalnej próby (N >= 50).
9. `stage09-aggregation`: synteza werdyktu, kategoryzacja ryzyk (czerwone/żółte/braki/zielone) i wyliczenie kwot.
10. `stage10-generation`: generowanie wersji poprawek (miękka/stanowcza) oraz maila negocjacyjnego.

Wszelkie wyliczenia kwotowe (np. maksymalna kaucja wg art. 6 ust. 1 ustawy o ochronie praw lokatorów) realizowane są przez kod deterministyczny, a nie przez arytmetykę LLM.

## Konsekwencje
- **Pozytywne:**
  - Całkowita eliminacja zmyślonych źródeł (grounding validation).
  - Niezależne testowanie każdego etapu testami jednostkowymi (Vitest).
  - Precyzyjne logowanie czasu i kosztów poszczególnych etapów.
  - Odporność na błędy: awaria jednego etapu nie niszczy całego pipeline'u (możliwość graceful degradation).
- **Negatywne/Wyzwania:**
  - Większa liczba wywołań pośrednich funkcji i transformacji danych.
  - Wymóg utrzymywania spójności schematów Zod na wszystkich granicach.
