# ADR 0008: Architektura kolejki zadań asynchronicznych w tle z wznawianiem i limitami czasu

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Zgodnie z obietnicą produktu (`AGENTS.md`) użytkownik powinien otrzymać wstępny werdykt w ciągu 60 sekund. Jednocześnie:
1. Umowy mogą liczyć od 2 do kilkudziesięciu stron, zawierać wielostronicowe zdjęcia z aparatu telefonu wymagające OCR oraz kilkadziesiąt klauzul wymagających odrębnej oceny i weryfikacji.
2. Standardowe synchroniczne funkcje serverless (Vercel) posiadają twarde limity czasu wykonania (15–60 s w zależności od planu). Przekroczenie limitu w trakcie oceny klauzuli nr 18 prowadziłoby do przerwania sesji i utraty danych.
3. Wymagany jest mechanizm asynchronicznego przetwarzania potoku z podziałem na etapy, rejestracją stanu pośredniego w bazie PostgreSQL, możliwością wznawiania (resumption) po awarii oraz bezpieczną degradacją.

## Decyzja
1. **Model kolejki opartej o bazę danych (Postgres-backed Job Queue):**
   - Tabela `public.analysis_jobs` w Supabase realizuje trwałą kolejkę zadań dla każdego etapu pipeline'u:
     - `stage`: bieżący krok (`ingest`, `classification`, `segmentation`, `checklist`, `retrieval`, `evaluation`, `validation`, `benchmark`, `aggregation`, `generation`).
     - `status`: `queued` | `running` | `completed` | `failed` | `retrying`.
     - `attempts`: licznik ponowień (maksymalnie 3).
     - `last_heartbeat`: stempel żywotności aktualizowany co 5 sekund przez wykonawcę.
     - `scheduled_at`: data planowanego uruchomienia (wsparcie exponential backoff przy ponowieniach).
2. **Dwufazowe dostarczanie wyników (Fast Verdict vs Full Report):**
   - **Faza 1 (Fast-Path, cel: < 60 s):** Ingest → Szybka Klasyfikacja → Segmentacja → Checklista uniwersalna/najmu → Ocena krytycznych klauzul czerwonych → Wyliczenie wstępnego werdyktu. Użytkownik natychmiast widzi jednozdaniowy werdykt i 3 kluczowe ryzyka na ekranie darmowym.
   - **Faza 2 (Background Enrichment):** Pełna weryfikacja wszystkich żółtych uwag, generowanie propozycji poprawek, DOCX ze śledzeniem zmian, PDF oraz szablony maili. Dociągane asynchronicznie w tle.
3. **Obsługa awarii i ponawianie (Resilience & Idempotency):**
   - Każdy etap pipeline'u jest idempotenty: ponowne uruchomienie etapu dla tego samego `analysis_id` nadpisuje lub uzupełnia wyłącznie ten etap bez powielania klauzul czy uwag.
   - W przypadku błędu sieciowego Vertex AI lub przekroczenia limitu zapytań (HTTP 429 / 503): zadanie przechodzi w stan `retrying` z opóźnieniem wykładniczym (1 s, 2 s, 4 s).
   - W przypadku wykrycia martwego zadania (`last_heartbeat` starszy niż 30 sekund i status `running`): scheduler automatycznie przejmuje zadanie do ponowienia.
4. **Bezpieczna degradacja (Graceful Degradation):**
   - Jeśli po 3 próbach etap Oceny nie zdoła zweryfikować konkretnej klauzuli: uwaga NIE jest zmyślana. Zostaje oznaczona jako `needs_verification` z adnotacją „Wymaga weryfikacji przez radcę prawnego”.
   - Raport końcowy generuje się zawsze ze statusem cząstkowym zamiast rzucać błędem 500 do użytkownika.
5. **Komunikacja z frontendem:**
   - Klient odpytuje stan analizy za pomocą Server-Sent Events (SSE) lub krótkiego poolingu (co 1.5 s) po chronionym tokenem sesyjnym endpoincie `/api/analysis/[id]/status`.
   - W nagłówkach stosowany jest `aria-live="polite"` do informowania czytników ekranu o przejściu do kolejnego etapu.

## Konsekwencje
- **Pozytywne:**
  - Całkowita odporność na limity timeoutu serverless.
  - Zero utraty postępu: po awarii pipeline wznawia się dokładnie od ostatniego niezakończonego etapu.
  - Szybkie pierwsze wrażenie: użytkownik poznaje werdykt w <60 s.
- **Wyzwania:**
  - Konieczność okresowego czyszczenia przeterminowanych zadań w `purge_expired_analyses()`.
