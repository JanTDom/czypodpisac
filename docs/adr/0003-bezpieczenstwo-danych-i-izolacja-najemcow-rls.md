# ADR 0003: Bezpieczeństwo danych, polityki RLS i retencja 7 dni

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Użytkownicy przesyłają dokumenty zawierające wrażliwe dane osobowe (PESEL, dane dowodu tożsamości, wysokość dochodów, adresy zamieszkania, rachunki bankowe). Wielu użytkowników korzysta z usługi anonimowo (bez konieczności zakładania stałego konta w procesie darmowej weryfikacji). Należy zagwarantować:
1. Całkowity zakaz publicznego odczytu umów innych użytkowników.
2. Niemożliwość podglądu lub modyfikacji cudzych analiz.
3. Automatyczne usuwanie danych po 7 dniach oraz możliwość natychmiastowego usunięcia na żądanie użytkownika („Usuń moje dane teraz”).
4. Blokadę eksfiltracji danych przez ataki typu Prompt Injection ukryte w tekście umowy.

## Decyzja
1. **Model sesji i uprawnień:**
   - Każda anonimowa analiza generuje kryptograficznie bezpieczny token sesji (`session_token`), przekazywany w bezpiecznym ciasteczku HTTP-only `SameSite=Lax` lub nagłówku `X-Session-Token`.
   - W tabelach bazodanowych (`analyses`, `analysis_clauses`, `analysis_findings`) dostęp przez rolę `anon` jest ograniczony wyłącznie do operacji INSERT, a operacje SELECT i UPDATE wymagają dopasowania hasza tokenu sesji (`session_token_hash = sha256(request_token)`).
   - Zalogowani użytkownicy podlegają standardowej polityce RLS `auth.uid() = user_id`.
2. **Izolacja magazynu plików (Storage RLS):**
   - Pliki w Supabase Storage są zapisywane w ścieżkach `/analyses/{session_id}/{filename}`.
   - Dostęp do plików mają wyłącznie autoryzowane funkcje serwerowe generujące krótkotrwałe URL-e ze stemplem czasowym (presigned URLs z TTL = 60 sekund).
3. **Cykl życia danych i retencja:**
   - Kolumny `created_at`, `expires_at` (domyślnie `NOW() + INTERVAL '7 days'`) oraz `deleted_at`.
   - Cykliczny proces czyszczący (Supabase pg_cron lub backend cron worker) trwale usuwa pliki ze storage i rekordy starsze niż 7 dni.
   - Endpoint `DELETE /api/analysis/[id]` natychmiastowo czyści pliki i oznacza rekordy jako usunięte.
4. **Ochrona przed Prompt Injection:**
   - Treść umowy jest wstrzykiwana do promptów wyłącznie jako strukturyzowany blok danych (np. `<contract_data>...</contract_data>`).
   - W instrukcji systemowej umieszczona jest niezmienna dyrektywa traktująca zawartość umowy jako pasywny ciąg znaków, z zakazem interpretacji komend lub prób nadpisania roli agenta.

## Konsekwencje
- **Pozytywne:**
  - Spełnienie wymogów OWASP ASVS Poziom 2 oraz OWASP Top 10 for LLM Applications.
  - Zminimalizowanie ryzyka wycieku danych w przypadku błędów na poziomie UI.
  - Zgodność z RODO (prawo do bycia zapomnianym i minimalizacja retencji).
- **Negatywne/Wyzwania:**
  - Konieczność bezpiecznego zarządzania tokenami sesyjnymi dla użytkowników niezalogowanych.
  - Wymóg regularnego testowania polityk RLS w testach integracyjnych.
