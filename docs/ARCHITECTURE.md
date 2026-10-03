# Architektura Umowa.check

## 1. Przegląd systemu i misja

Umowa.check to weryfikator umów dla konsumentów i mikroprzedsiębiorców w Polsce.
System weryfikuje umowę w czasie poniżej 60 sekund i generuje:
1. Jednozdaniowy werdykt („Można podpisać po zmianie §7 i §12”).
2. Raport świetlny (czerwone, żółte, braki, zielone) z odnośnikiem do paragrafu i podświetleniem w tekście.
3. Kwotowe oszacowanie ryzyka oparte na faktach i precyzyjnych założeniach.
4. Listę braków (klauzul wymaganych przez prawo lub standard rynkowy).
5. Gotowe propozycje poprawek (wersja miękka i stanowcza) oraz gotowe maile negocjacyjne.
6. Opcję bezpiecznej eskalacji do radcy prawnego lub adwokata.

### Główne pryncypia architektoniczne
- **Zero zmyślania (Grounding First):** Żadna uwaga prawna nie może trafić do raportu bez zweryfikowanego identyfikatora jednostki prawnej w `legal-kb/` oraz dosłownego cytatu z dokumentu.
- **Dekompozycja zamiast megamonolitu:** Pipeline podzielony na 10 niezależnych, deterministycznie testowalnych etapów z kontraktami wejścia/wyjścia (Zod).
- **Prywatność i RODO by Design:** Przetwarzanie i bazy danych wyłącznie w regionie Unii Europejskiej, automatyczne usuwanie danych po 7 dniach (z opcją natychmiastowego usunięcia jednym kliknięciem), anonimizacja przed jakimkolwiek benchmarkingiem.
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
   - Ochrona kosztowa (Rate Limiting, Access Tokens dla AI)
   - Orkiestrator Pipeline'u Analizy (10 etapów)
         │
         ├───► [ Supabase EU (Frankfurt) ]
         │        - PostgreSQL 16 + Row Level Security (RLS)
         │        - pgvector (wyszukiwanie semantyczne w legal-kb)
         │        - Supabase Storage (szyfrowane pliki umów, path-based RLS)
         │        - Automatyczny retencyjny cleanup (pg_cron / TTL 7 dni)
         │
         ├───► [ Usługa OCR / Parser Dokumentów (Region UE) ]
         │        - PDF / DOCX / Obrazy wielostronicowe
         │        - Ekstrakcja układu, tekstu i współrzędnych do podświetleń
         │
         ├───► [ Modele LLM (Region UE, Zero-Data Retention, No-Training) ]
         │        - Klasyfikacja, ekstrakcja klauzul, ocena ryzyk na bazie źródeł
         │        - Ścisły format JSON wymuszany schematami Zod
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
(ID w KB? Cytat OK?) (Odchylenie rynkowe) (Werdykt, kwoty)   (Poprawki, mail)
```

1. **Etap 1: INGEST (`stage01-ingest`)**  
   Przyjęcie pliku (PDF, DOCX, zdjęcia), normalizacja stron, OCR dla skanów/zdjęć, budowa mapy współrzędnych bloków tekstu dla widoku podświetleń.
2. **Etap 2: KLASYFIKACJA (`stage02-classification`)**  
   Automatyczna identyfikacja typu umowy (np. najem lokalu mieszkalnego, najem okazjonalny), roli użytkownika (najemca / wynajmujący) oraz statusu prawnego (konsument / przedsiębiorca na prawach konsumenta / przedsiębiorca). W przypadku niejednoznaczności generowane są maksymalnie 3 precyzyjne pytania do użytkownika.
3. **Etap 3: SEGMENTACJA (`stage03-segmentation`)**  
   Parsowanie struktury dokumentu na logiczne jednostki: paragrafy (§), ustępy, punkty, załączniki oraz powiązania wewnętrzne (definicje).
4. **Etap 4: CHECKLISTA (`stage04-checklist`)**  
   Dopasowanie klauzul do stałej, zdefiniowanej checklisty prawnej dla danego typu umowy. Identyfikacja klauzul obecnych oraz stwierdzenie braków krytycznych.
5. **Etap 5: RETRIEVAL (`stage05-retrieval`)**  
   Hybrydowe wyszukiwanie w `legal-kb/` (filtry po typie umowy, jednostkach redakcyjnych, słowach kluczowych i wektorach pgvector). Przygotowanie minimalnego, autorytatywnego kontekstu prawnego.
6. **Etap 6: OCENA RYZYKA (`stage06-evaluation`)**  
   Model językowy otrzymuje wyizolowaną klauzulę, punkt checklisty oraz WYŁĄCZNIE pobrane źródła z `legal-kb/`. Zwraca strukturalny JSON: kolor (czerwony/żółty/zielony), proste uzasadnienie, identyfikatory źródeł, pewność oraz scenariusz kwotowy.
7. **Etap 7: WALIDACJA ŹRÓDEŁ I CYTATÓW (`stage07-validation`)**  
   Deterministyczny kod walidacyjny sprawdza:
   - Czy każde zgłoszone `source_id` istnieje w `legal-kb/` i jest w statusie `active`.
   - Czy cytat z umowy występuje dosłownie w treści dokumentu.
   - W przypadku braku dopasowania: uwaga zostaje odrzucona lub oznaczona jako „wymaga weryfikacji” (nie publikowana jako fakt).
8. **Etap 8: BENCHMARK RYNKOWY (`stage08-benchmark`)**  
   Porównanie parametrów (np. wysokość kaucji, termin wypowiedzenia, kary umowne) z bazą rynkową. Oznaczenie jako standard / odchylenie / skrajność następuje tylko przy spełnieniu progu minimalnej próby statystycznej (N >= 50).
9. **Etap 9: AGREGACJA I WERDYKT (`stage09-aggregation`)**  
   Generowanie jednozdaniowego werdyktu, kategoryzacja uwag (czerwone, żółte, braki, zielone), obliczenie sumarycznego ryzyka finansowego w oparciu o jawne formuły matematyczne.
10. **Etap 10: GENEROWANIE POPRAWEK I MAILI (`stage10-generation`)**  
    Przygotowanie gotowych klauzul zamiennych (wersja miękka i stanowcza) na bazie zatwierdzonych szablonów oraz generowanie szablonu maila do drugiej strony umowy.

---

## 4. Bezpieczeństwo, RODO i ochrona przed atakami

1. **Przetwarzanie w UE:**
   - Supabase hostowany w regionie UE (Frankfurt).
   - Funkcje Vercel skonfigurowane na region `fra1` (Frankfurt).
   - Dostawca LLM z podpisaną umową DPA (Data Processing Agreement), przetwarzaniem w UE i zerową retencją logów treningowych.
2. **Izolacja danych i RLS:**
   - Każda tabela chroniona przez PostgreSQL Row Level Security (RLS).
   - Anonimowi użytkownicy otrzymują kryptograficzny token sesji (`session_token`), z dostępem wyłącznie do własnych analiz. Brak możliwości listowania cudzych umów.
   - Ścieżki w Supabase Storage izolowane identyfikatorem sesji: `analyses/<session_id>/original.<ext>`.
3. **Retencja danych (7 dni):**
   - Każda analiza posiada pole `expires_at = NOW() + INTERVAL '7 days'`.
   - Automatyczny worker usuwa pliki ze storage i rekordy po upływie terminu.
   - W UI dostępny jest przycisk natychmiastowego usunięcia danych („Usuń moje dane teraz”).
4. **Ochrona przed Prompt Injection:**
   - Treść umowy jest traktowana jako w 100% niezaufany ciąg znaków (`Untrusted External Input`).
   - Treść przekazywana do modeli jest ściśle izolowana w wyodrębnionych blokach XML/JSON, z dyrektywami systemowymi blokującymi interpretację instrukcji zawartych w treści umowy.
   - Format wyjściowy jest walidowany schematem Zod z odrzuceniem jakichkolwiek nadmiarowych pól.
5. **Brak PII w logach:**
   - Logi aplikacyjne rejestrują wyłącznie metadane techniczne: czas wykonania etapów, liczbę tokenów, koszt zapytania, liczbę wykrytych klauzul.
   - Nazwiska, adresy, numery PESEL, numery kont i cytaty z umów są wykluczone z logów i analityki.

---

## 5. Dostępność i UX (WCAG 2.2 AA)

- **Podstawowy scenariusz mobilny:** Szybkie wykonanie serii zdjęć umowy smartfonem (viewport 360px), podgląd miniatur, automatyczne prostowanie i scalenie przed wysyłką.
- **Wielokanałowa informacja:** Kolor nigdy nie jest jedynym wskaźnikiem ryzyka. Zawsze towarzyszy mu czytelna ikona SVG oraz tekstowa etykieta („Krytyczne ryzyko”, „Wymaga uwagi”, „Brak w umowie”, „Zgodne z prawem”).
- **Synchronizacja widoków na desktopie:** Dwukolumnowy układ (podgląd umowy po lewej, lista uwag po prawej). Kliknięcie w uwagę automatycznie centruje i podświetla odpowiedni fragment dokumentu.
- **Płynna informacja o postępie:** Dynamiczne etykiety postępu z atrybutem `aria-live="polite"` informujące użytkowników czytników ekranu o aktualnym etapie przetwarzania.
