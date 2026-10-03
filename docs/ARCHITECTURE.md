# Architektura czypodpisac.pl

## 1. Przegląd systemu i obietnica dla użytkownika

**Obietnica produktu:**  
*„Wrzuć umowę. W minutę wiesz, czy podpisać, co zmienić i jak o to poprosić.”*

System weryfikuje umowę w czasie poniżej 60 sekund i dostarcza:
1. **Werdykt w jednym zdaniu:** PODPISZ / PODPISZ PO ZMIANACH / NIE PODPISUJ BEZ PRAWNIKA.
2. **Najważniejsze ryzyka po ludzku:** z cytatem z umowy i wyliczoną kwotą, ile mogą kosztować.
3. **Braki:** czego w umowie nie ma, a powinno być.
4. **Gotowe nowe brzmienie złych zapisów:** wariant dyplomatyczny (miękki) i stanowczy.
5. **Gotowy mail do drugiej strony:** gotowy do skopiowania lub pobrania.
6. **Eksport:** DOCX ze śledzeniem zmian (`track changes`) oraz PDF raportu.
7. **Bezpieczna eskalacja:** konsultacja z prawnikiem jednym kliknięciem przy wyniku czerwonym.

### Główne pryncypia architektoniczne
- **Zero zmyślania (Grounding First):** Żadna uwaga prawna nie może trafić do raportu bez zweryfikowanego identyfikatora jednostki prawnej w `legal-kb/` oraz dosłownego cytatu z dokumentu.
- **Dekompozycja zamiast monolitu:** Pipeline podzielony na 10 niezależnych, deterministycznie testowalnych etapów z kontraktami wejścia/wyjścia wymuszanymi schematami Zod.
- **Prywatność i RODO by Design:** Przetwarzanie i bazy danych wyłącznie w regionie Unii Europejskiej, automatyczne usuwanie danych po 7 dniach (z opcją natychmiastowego usunięcia jednym kliknięciem), zakaz trenowania AI na umowach.
- **Dostępność WCAG 2.2 AA:** Pełna obsługa z klawiatury, widoczne wskaźniki focusu, kontrast, czytniki ekranu (`aria-live`), responsywność od 360 px (scenariusz zdjęcia telefonem).

---

## 2. Architektura techniczna (Stos)

```
[ Klient Przeglądarkowy ]
   - Next.js (App Router, React 19)
   - Tailwind CSS + shadcn/ui (Radix Primitives)
   - WCAG 2.2 AA, Mobile-first (360px viewport)
   - Dwukolumnowy raport z synchronicznym podglądem podświetleń
         │
         │ HTTPS / API Routes (Vercel Region EU - fra1)
         ▼
[ Warstwa API / Serverless ]
   - Zod Boundary Validation na każdym punkcie wejścia
   - Autoryzacja sesyjna i anonimowe tokeny sesyjne
   - Orkiestrator Pipeline'u Analizy (10 etapów)
   - Asynchroniczna kolejka zadań w tle (analysis_jobs)
         │
         ├───► [ Supabase EU (Frankfurt / eu-central-1) ]
         │        - PostgreSQL 16 + Row Level Security (RLS)
         │        - pgvector (wyszukiwanie semantyczne 768-dim w legal-kb)
         │        - Supabase Storage (szyfrowane pliki umów, path-based RLS)
         │        - Automatyczny retencyjny cleanup (pg_cron / TTL 7 dni)
         │        - Kolejka zadań w tle (analysis_jobs z heartbeat i retry)
         │
         ├───► [ Google Cloud Vertex AI (Region UE: europe-central2 / europe-west1) ]
         │        - Fast Model: gemini-2.0-flash (OCR, klasyfikacja, segmentacja)
         │        - Flagship Model: gemini-1.5-pro-002 (ocena klauzul, poprawki)
         │        - Verifier Model: gemini-1.5-pro-002 (odizolowany weryfikator tezy)
         │        - Multilingual Embedding: text-embedding-004 (768 wymiarów)
         │        - Context Caching dla stałych części instrukcji i checklist
         │        - Structured Output wymuszany przez JSON Schema
         │
         └───► [ Bramka Płatności Stripe ]
                  - Obsługa BLIK, Przelewy24, kart
                  - Idempotentne webhooki z weryfikacją sygnatury w czasie stałym
```

---

## 3. Pipeline analizy umowy (10 etapów)

Pipeline realizuje przepływ od nieustrukturyzowanego pliku do zweryfikowanego raportu:

```
[1. Ingest] ──────► [2. Klasyfikacja] ──► [3. Segmentacja]
(Plik -> Tekst+Układ) (Typ umowy, rola, status) (§, ust., pkt)
                                                 │
                                                 ▼
[6. Ocena LLM] ◄─── [5. Retrieval] ◄───── [4. Checklista]
(Klauzula + KB -> JSON) (legal-kb hybrydowo) (Mapowanie punktów)
       │
       ▼
[7. Walidacja] ───► [8. Benchmark] ───► [9. Agregacja] ──► [10. Generowanie]
(Audyt kodu + Gemini) (Odchylenie rynkowe) (Werdykt, kwoty)   (Poprawki, mail)
```

1. **Etap 1: INGEST (`stage01-ingest`)**  
   Przyjęcie pliku (PDF, DOCX, zdjęcia), normalizacja stron, multimodalny OCR Gemini + OCR klasyczny, budowa mapy współrzędnych bloków tekstu dla widoku podświetleń.
2. **Etap 2: KLASYFIKACJA (`stage02-classification`)**  
   Automatyczna identyfikacja typu umowy, roli stron oraz statusu konsumenckiego (konsument / przedsiębiorca na prawach konsumenta / przedsiębiorca). Maksymalnie 2 precyzyjne pytania kontekstowe w formie przycisków tylko wtedy, gdy odpowiedź zmienia ocenę prawną.
3. **Etap 3: SEGMENTACJA (`stage03-segmentation`)**  
   Parsowanie struktury dokumentu na logiczne jednostki: paragrafy (§), ustępy, punkty, załączniki oraz powiązania wewnętrzne (definicje, odesłania do OWU).
4. **Etap 4: CHECKLISTA (`stage04-checklist`)**  
   Dopasowanie klauzul do checklisty uniwersalnej oraz checklisty właściwej dla danego typu umowy. Wykrywanie braków krytycznych.
5. **Etap 5: RETRIEVAL (`stage05-retrieval`)**  
   Hybrydowe wyszukiwanie w `legal-kb/` (filtry po typie umowy, jednostkach redakcyjnych, słowach kluczowych i wektorach pgvector).
6. **Etap 6: OCENA RYZYKA (`stage06-evaluation`)**  
   Najmocniejszy model otrzymuje wyizolowaną klauzulę oraz WYŁĄCZNIE pobrane źródła z `legal-kb/`. Zwraca strukturalny JSON: ocena (czerwony/żółty/zielony), proste uzasadnienie, ID źródeł, pewność i scenariusz kwotowy.
7. **Etap 7: WALIDACJA DWUWARSTWOWA (`stage07-validation`)**  
   - Warstwa A (kod): deterministyczny audyt istnienia ID źródła w `legal-kb/`, statusu obowiązywania oraz dosłowności cytatu w dokumencie.
   - Warstwa B (Gemini-weryfikator): odizolowane zapytanie do najmocniejszego modelu, które bez wglądu w pierwotne uzasadnienie weryfikuje, czy źródło faktycznie popiera tezę (`popiera` / `nie_popiera` / `niepewne`).
8. **Etap 8: BENCHMARK RYNKOWY (`stage08-benchmark`)**  
   Porównanie parametrów (wysokość kaucji, terminy, kary umowne) z bazą rynkową. Oznaczenie jako standard / odchylenie / skrajność następuje tylko przy próbie statystycznej N >= 50.
9. **Etap 9: AGREGACJA I WERDYKT (`stage09-aggregation`)**  
   Generowanie jednozdaniowego werdyktu (`PODPISZ` / `PODPISZ PO ZMIANACH` / `NIE PODPISUJ BEZ PRAWNIKA`), kategoryzacja uwag, matematyczne podsumowanie kwot ryzyka.
10. **Etap 10: GENEROWANIE POPRAWEK I MAILI (`stage10-generation`)**  
    Przygotowanie gotowych klauzul zamiennych (wersja miękka i stanowcza) na bazie zatwierdzonych szablonów, generowanie maila negocjacyjnego oraz eksportu DOCX ze śledzeniem zmian i PDF.

---

## 4. Plan kolejki zadań i odporność na awarie (ADR 0008)

Analiza dużych dokumentów jest orkiestrowana dwufazowo za pośrednictwem tabeli `public.analysis_jobs` w PostgreSQL:
1. **Faza 1 (Fast-Path, cel < 60 s):**
   - Ingest → Klasyfikacja → Segmentacja → Checklista → Ocena ryzyk czerwonych → Wstępny werdykt i 3 kluczowe uwagi.
   - Użytkownik natychmiast widzi wynik bez czekania na pełne generowanie eksportów.
2. **Faza 2 (Background Enrichment):**
   - Pełna ocena pozostałych klauzul, generowanie poprawek, DOCX i maili dociągane w tle.
3. **Idempotencja i wznawianie:**
   - Każdy etap zapisuje stan do bazy. W razie timeoutu funkcja wznawia pracę dokładnie od ostatniego niezakończonego etapu.
   - Ponawianie z exponential backoff (1s, 2s, 4s) przy limitach rate limit.

---

## 5. Rejestr Decyzji Architektonicznych (ADR)

- [ADR 0001: Wybór stosu technologicznego i lokalizacja danych w UE](docs/adr/0001-stack-technologiczny-i-lokalizacja-danych-ue.md)
- [ADR 0002: Dekompozycja pipeline analizy umów na 10 etapów](docs/adr/0002-dekompozycja-pipeline-analizy-umow.md)
- [ADR 0003: Bezpieczeństwo danych, polityki RLS i retencja 7 dni](docs/adr/0003-bezpieczenstwo-danych-i-izolacja-najemcow-rls.md)
- [ADR 0004: Struktura bazy wiedzy prawnej (legal-kb) i deterministyczna weryfikacja źródeł](docs/adr/0004-struktura-bazy-wiedzy-prawnej-i-weryfikacja-zrodel.md)
- [ADR 0005: Architektura generowania raportów PDF i eksportu DOCX ze śledzeniem zmian](docs/adr/0005-generowanie-eksportow-pdf-i-docx.md)
- [ADR 0006: Czułość na zmiany prawa i synchronizacja z oficjalnym API Sejmu RP (ELI)](docs/adr/0006-czulosc-na-zmiany-prawa-i-synchronizacja-z-api-sejmu-eli.md)
- [ADR 0007: Konfiguracja modeli Gemini przez Vertex AI w regionie UE, role modeli i Context Caching](docs/adr/0007-konfiguracja-modeli-gemini-vertex-ai-i-context-caching.md)
- [ADR 0008: Architektura kolejki zadań asynchronicznych w tle z wznawianiem i limitami czasu](docs/adr/0008-architektura-kolejki-zadan-w-tle-i-odpornosc-na-awarie.md)
