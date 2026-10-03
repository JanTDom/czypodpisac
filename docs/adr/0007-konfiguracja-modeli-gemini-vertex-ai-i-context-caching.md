# ADR 0007: Konfiguracja modeli Gemini przez Vertex AI w regionie UE, role modeli i Context Caching

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Zgodnie z regułą nadrzędną `03-gemini-api.md`:
1. Dostęp do modeli Gemini musi odbywać się przez Google Cloud Vertex AI z gwarancją rezydentury danych w Unii Europejskiej (preferowany region `europe-central2` Warszawa, alternatywnie `europe-west1` / `eu` multi-region).
2. Wykluczone jest korzystanie z bezpłatnego poziomu Gemini AI Studio dla danych umów użytkowników (regulamin dopuszcza trenowanie). Wymagany jest wyłącznie płatny dostęp korporacyjny z umową powierzenia przetwarzania danych (DPA) i zerową retencją danych wejściowych.
3. Nazwy modeli NIE mogą być zaszyte na sztywno w logice pipeline'u — ich definicja musi znajdować się w jednym module konfiguracyjnym z możliwością bezpiecznego nadpisywania zmiennymi środowiskowymi.
4. Należy zdefiniować wyraźny podział ról modeli: szybki model do klasyfikacji, segmentacji i pytań; najmocniejszy model do oceny i redakcji poprawek; odizolowany weryfikator do niezależnego audytu; dedykowany model embeddingów.

## Decyzja
1. **Centralny moduł konfiguracji:**
   Wdrożono `src/config/models.ts` z walidacją schematem Zod (`GeminiModelConfigSchema`). Konfiguracja definiuje:
   - `fastModel`: `gemini-2.0-flash` (rezerwa: `gemini-1.5-flash-002`) — dla etapów Ingest (multimodalny OCR), Klasyfikacja i pytania kontekstowe, Segmentacja klauzul. Czas odpowiedzi < 2 s.
   - `flagshipModel`: `gemini-1.5-pro-002` (lub `gemini-2.5-pro`) — dla etapu Oceny ryzyka (`stage06-evaluation`) oraz Generowania poprawek i maili negocjacyjnych (`stage10-generation`).
   - `verifierModel`: `gemini-1.5-pro-002` — dla niezależnego Gemini-weryfikatora (`stage07-validation`). Weryfikator otrzymuje wyłącznie wyizolowany cytat z umowy, tezę i jednostki z `legal-kb/` bez dostępu do pierwotnego uzasadnienia.
   - `embeddingModel`: `text-embedding-004` (768 wymiarów, wielojęzyczny) — dla wyszukiwania semantycznego w `legal-kb_units`.
2. **Determinizm i Structured Output:**
   - Wszystkie zapytania ewaluacyjne i weryfikacyjne korzystają z temperatury `temperature: 0.0` oraz ścisłego wymuszenia `responseSchema` (JSON Schema) generowanego bezpośrednio ze schematów Zod.
   - Niezgodność odpowiedzi z formatem JSON skutkuje natychmiastowym ponowieniem z błędem walidacji (maksymalnie 2 próby), a w razie niepowodzenia — bezpieczną degradacją (oznaczenie uwagi jako „wymaga weryfikacji”, brak fałszywych twierdzeń).
3. **Context Caching Vertex AI:**
   - Stałe fragmenty promptów (instrukcje systemowe, schematy checklist, podstawowe przepisy Kodeksu cywilnego i UoPL przekraczające próg 32 768 tokenów) są rejestrowane w mechanizmie Context Caching Vertex AI z czasem życia TTL = 60 minut.
   - Pozwala to zredukować koszty inferencji o 75% i skrócić czas pierwszego tokena (TTFT) o 80%.
4. **Izolacja danych i ochrona przed prompt injection:**
   - Treść umowy jest przekazywana modelowi w wydzielonym bloku danych XML (`<untrusted_document_content>`).
   - Instrukcja systemowa jednoznacznie zakazuje modelowi traktowania treści dokumentu jako poleceń.

## Konsekwencje
- **Pozytywne:**
  - Pełna zgodność z RODO i zakazem trenowania AI na umowach.
  - Elastyczność: aktualizacja wersji modelu wymaga zmiany w jednym pliku konfiguracyjnym lub zmiennej środowiskowej.
  - Spójność typów: schematy Zod sterują zarówno walidacją w kodzie TypeScript, jak i `responseSchema` w Vertex AI.
- **Wyzwania:**
  - Wymóg monitorowania dostępności poszczególnych wersji modeli w regionach europejskich GCP.
