# ADR 0004: Struktura bazy wiedzy prawnej (legal-kb) i deterministyczna weryfikacja źródeł

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Zgodnie z regułą nadrzędną `02-prawo-i-zrodla.md` oraz `AGENTS.md`:
- Obowiązuje bezwzględny ZAKAZ ZMYŚLANIA przepisów, numerów artykułów, sygnatur wyroków czy wpisów w rejestrze klauzul niedozwolonych UOKiK.
- Silnik cytuje WYŁĄCZNIE fragmenty z `legal-kb/`. Model nie może dodać przepisu spoza pobranego kontekstu.
- Każdy wpis w bazie prawnej musi posiadać stałe, unikalne metadane: URL źródła z ISAP/Sejm API, datę pobrania, datę stanu prawnego oraz skrót SHA-256 treści.

## Decyzja
1. **Format jednostki prawnej w `legal-kb/`:**
   Każdy akt prawny jest dzielony na atomowe jednostki redakcyjne (artykuły, ustępy) i przechowywany w ustrukturyzowanym formacie JSON/Markdown z następującym schematem:
   - `id`: stabilny identyfikator (np. `kc-art-385-1`, `uopl-art-6-ust-1`),
   - `type`: `statute` | `uokik_clause` | `court_ruling` | `official_guidance`,
   - `act_title`: pełny tytuł aktu (np. „Kodeks cywilny”, „Ustawa o ochronie praw lokatorów...”),
   - `publication_address`: adres publikacyjny (np. „Dz.U. 2023 poz. 1610”),
   - `editorial_unit`: jednostka redakcyjna (np. „art. 6 ust. 1”),
   - `content`: dokładna treść jednostki redakcyjnej pobrana z ISAP/API Sejmu,
   - `source_url`: oficjalny URL (ISAP / ELI Sejm / CURIA / UOKiK),
   - `fetch_date`: data pobrania,
   - `legal_state_date`: data stanu prawnego aktu,
   - `content_hash`: suma kontrolna SHA-256 treści,
   - `status`: `active` | `repealed` | `amended`,
   - `contract_types`: tagi typów umów, dla których jednostka ma zastosowanie (np. `najem_lokalu`, `najem_okazjonalny`).
2. **Deterministyczna walidacja w etapie 7:**
   - Wygenerowana przez LLM ocena ryzyka zawiera listę `source_ids`.
   - Kod weryfikatora odpytuje pamięć `legal-kb/`: jeśli jakikolwiek `source_id` nie istnieje lub ma status inny niż `active`, uwaga jest oznaczana jako „wymaga weryfikacji” lub wycofywana z raportu.
   - Cytat umowy podany w uwadze jest sprawdzany pod kątem dokładnego występowania (dokładny podciąg) w tekście wyekstrahowanym w etapie Ingest. Brak dosłownego cytatu blokuje publikację uwagi jako faktu.

## Konsekwencje
- **Pozytywne:**
  - 100% gwarancja prawdziwości źródeł prawnych w wygenerowanym raporcie.
  - Ochrona użytkownika przed fałszywymi interpretacjami prawnymi generowanymi przez modele językowe.
  - Możliwość automatycznego wygaszania uwag powiązanych ze zmienionymi przepisami po uruchomieniu workflowu `/aktualizacja-prawa`.
- **Negatywne/Wyzwania:**
  - Wymóg precyzyjnego parsowania i stałego utrzymywania bazy aktów w `legal-kb/`.
  - Wymóg staranności przy podziale aktów na jednostki redakcyjne.
