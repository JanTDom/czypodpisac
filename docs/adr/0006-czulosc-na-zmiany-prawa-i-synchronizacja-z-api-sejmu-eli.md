# ADR 0006: Czułość na zmiany prawa i synchronizacja z oficjalnym API Sejmu RP (ELI)

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Prawo w Polsce ulega częstym i istotnym nowelizacjom (zwłaszcza przepisy Kodeksu cywilnego, Ustawy o ochronie praw lokatorów, Kodeksu pracy oraz przepisów konsumenckich).
Weryfikator umów opierający się na nieaktualnym stanie prawnym lub uchylonych przepisach wprowadzałby konsumentów i przedsiębiorców w błąd, rodząc wysokie ryzyko prawne i finansowe.
Naczelną zasadą systemu jest **ZAKAZ ZMYŚLANIA** oraz rygorystyczne opieranie każdej oceny wyłącznie na autentycznych, aktualnych źródłach prawnych.

Wymóg nadrzędny:
*„Projekt ma być wyczulony na zmiany i aktualizacje prawa. Musi umieć od razu znajdować to co aktualne.”*

## Decyzja

1. **Bezpośrednia integracja z oficjalnym API Sejmu RP (Europejski Identyfikator Prawa — ELI):**
   - Wdrożono dedykowanego klienta `EliApiClient` komunikującego się z endpointem `https://api.sejm.gov.pl/eli`.
   - Każdy akt rejestrowany w `legal-kb/` jest powiązany ze stałym identyfikatorem ELI aktu podstawowego (np. `DU/2001/733`, `DU/1964/93`, `DU/1974/141`) oraz najnowszego tekstu jednolitego (np. `DU/2023/725` dla UoPL).
   - Klient monitoruje metadane aktu: status obowiązywania (`inForce`), datę wejścia w życie, listę aktów zmieniających (`references["Akty zmieniające"]`) oraz nowe obwieszczenia o tekstach jednolitych (`references["Inf. o tekście jednolitym"]`).

2. **Dedykowany strażnik aktualności (`LawFreshnessGuard`):**
   - Porównuje datę stanu prawnego jednostki (`legalStateDate`) z datami ogłoszenia i wejścia w życie aktów nowelizujących w Sejmie RP.
   - W przypadku wykrycia aktu zmieniającego ogłoszonego po dacie stanu prawnego jednostki, automatycznie oznacza status jednostki jako `needs_review` (wymaga weryfikacji) lub `amended`.
   - W przypadku uchylenia aktu, natychmiast oznacza jednostkę jako `repealed` (uchylona) i rekomenduje jej deaktywację.

3. **Deterministyczna kaskada unieważniania (Cascade Invalidation):**
   - Wykrycie nowelizacji jednostki prawnej w `legal-kb/` natychmiast identyfikuje wszystkie powiązane punkty checklist kontrolnych (przez relację `kbSourceIds`).
   - Status autoryzacji punktu kontrolnego checklisty (`lawyerReviewStatus`) zostaje natychmiast przełączony z `approved` na `needs_update`.
   - W Etapie 7 Pipeline (Validation): silnik weryfikuje status wszystkich źródeł przypisanych do generowanych uwag. Jeżeli uwaga dotyczy jednostki o statusie `needs_review` lub `amended`, uwaga nie może zostać opublikowana jako niewzruszony fakt prawny — otrzymuje status `needs_verification` z jawnym ostrzeżeniem: *„Przepis uległ nowelizacji i wymaga potwierdzenia przez radcę prawnego”*.

4. **Metoda wyszukiwania wyłącznie aktualnego prawa (`findCurrentLaw`):**
   - Moduł `LegalKnowledgeBase` udostępnia dedykowaną metodę `findCurrentLaw()`, która w procesie wyszukiwania odcina i odrzuca wszelkie jednostki uchylone lub nieaktywne, gwarantując, że prompty LLM i algorytmy oceny ryzyka operują wyłącznie na obowiązującym prawie.

5. **Zautomatyzowany audyt i workflow `/aktualizacja-prawa`:**
   - Wdrożono skrypt `scripts/check-law-updates.ts` umożliwiający cykliczny audyt stanu prawnego całej bazy w Sejmie ELI i zapisywanie ustrukturyzowanych raportów do `docs/eval/law-freshness-audit.json`.

## Konsekwencje
- **Pozytywne:**
  - System w czasie rzeczywistym i cyklicznie wykrywa nowelizacje polskiego prawa w oficjalnym źródle Sejmu RP.
  - Zero ryzyka przedstawienia użytkownikowi uchylonego przepisu jako obowiązującego prawa.
  - Pełna audytowalność i zgodność z Europejskim Aktem o Sztucznej Inteligencji (AI Act) oraz zasadą rzetelności.
- **Negatywne/Wyzwania:**
  - Konieczność uwzględnienia limitów zapytań (rate limiting) i ewentualnych przestojów API Sejmu (rozwiązana przez cache w pamięci oraz mechanizmy retry i timeout).
