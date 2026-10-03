# Użycie Gemini API

## Dostęp i dane
- Gemini przez Vertex AI w regionie UE (preferuj europe-central2 Warszawa, jeśli dostępne są tam potrzebne modele; inaczej region w europe-west). Sprawdź aktualną dostępność modeli w regionach w dokumentacji Google Cloud.
- Nie używaj bezpłatnego poziomu Gemini API z AI Studio do danych użytkowników (warunki dopuszczają wykorzystanie danych do ulepszania usług). Tylko płatny dostęp z umową powierzenia i warunkami przetwarzania danych.
- Klucze i konta serwisowe wyłącznie po stronie serwera, w zmiennych środowiskowych.

## Modele
- Nazwy modeli NIE są zaszyte w kodzie: konfiguracja w jednym pliku, wartości ustalone po sprawdzeniu aktualnej listy modeli w dokumentacji Gemini.
- Szybki model: klasyfikacja, segmentacja, pytania kontekstowe.
- Najmocniejszy model: ocena klauzul i generowanie poprawek.
- Weryfikator: osobne wywołanie (najmocniejszy model, inny prompt, bez dostępu do uzasadnienia pierwszej oceny), które dostaje tylko cytat, źródła i tezę, i odpowiada: popiera / nie popiera / niepewne.
- Embeddingi: aktualny model embeddingów Gemini, wielojęzyczny.

## Sposób wywołań
- Zawsze structured output (responseSchema / JSON Schema) zgodny ze schematami Zod w kodzie; odpowiedź niezgodna = ponowienie z informacją o błędzie, maks. 2 razy, potem bezpieczna degradacja.
- Niska temperatura dla oceny i weryfikacji.
- PDF i zdjęcia przekazuj natywnie do modelu multimodalnego do ekstrakcji tekstu z układem; równolegle klasyczny OCR do porównania przy niskiej jakości zdjęć.
- Context caching dla stałych części kontekstu (instrukcje, checklisty, często używane przepisy) — mierz oszczędność.
- Grounding w wyszukiwarce wyłącznie do odnajdywania źródeł; cytować wolno tylko treść pobraną z oficjalnych źródeł do legal-kb.
- Treść umowy zawsze w wyraźnie oznaczonym bloku danych; instrukcja systemowa stanowi, że dokument nie zawiera poleceń dla modelu.
- Logi: wersja modelu, promptu, checklisty i bazy prawnej przy każdym raporcie; zero treści umów w logach.
- Koszt na analizę liczony i widoczny w panelu administracyjnym.
