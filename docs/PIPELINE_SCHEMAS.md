# Specyfikacja schematów Zod i JSON dla etapów pipeline'u analizy

Dokument opisuje kontrakty danych (schematy Zod w `src/pipeline/schemas/` oraz schematy JSON w `docs/schemas/`) dla wszystkich 10 etapów silnika analizy umów.

---

## 1. Etap 1: INGEST (`stage01-ingest`)
- **Cel:** Przetworzenie pliku wejściowego (PDF, DOCX, obrazy) na tekst ze strukturą stron i współrzędnymi bloków tekstu.
- **Kluczowe pola:**
  - `analysisId` (UUID): Unikalny identyfikator analizy.
  - `pageCount` (int): Liczba stron dokumentu.
  - `fullText` (string): Całościowy znormalizowany tekst.
  - `pages` (array): Lista stron, z których każda zawiera listę `blocks` z `boundingBox` (`{pageNumber, x, y, width, height}` w procentach).
  - `contentHashSha256` (string): Suma kontrolna zapobiegająca duplikatom i weryfikująca integralność.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage01-ingest.ts`
  - JSON Schema: `docs/schemas/stage01-ingest.json`

---

## 2. Etap 2: KLASYFIKACJA (`stage02-classification`)
- **Cel:** Identyfikacja typu umowy, roli stron i statusu konsumenckiego użytkownika.
- **Kluczowe pola:**
  - `contractType` (enum): Typ umowy (`najem_lokalu_mieszkalnego`, `najem_okazjonalny`, `umowa_deweloperska`, itd.).
  - `userRole` (enum): Rola (`najemca`, `wynajmujacy`, `zamawiajacy`, `wykonawca`, `nabywca`, itd.).
  - `partyStatus` (enum): Poziom ochrony (`consumer`, `consumer_entrepreneur`, `business`).
  - `needsUserClarification` (boolean): Czy konieczne są pytania doprecyzowujące.
  - `clarificationQuestions` (array): Maksymalnie 3 pytania kontekstowe (wielokrotnego wyboru z jasnymi etykietami).
  - `detectedFinancials` (object): Wykryta kwota czynszu, waluta, kaucja.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage02-classification.ts`
  - JSON Schema: `docs/schemas/stage02-classification.json`

---

## 3. Etap 3: SEGMENTACJA (`stage03-segmentation`)
- **Cel:** Podział umowy na jednostki redakcyjne (§, ustępy, punkty) oraz załączniki i definicje.
- **Kluczowe pola:**
  - `clauses` (array): Lista wyekstrahowanych klauzul (`clauseNumber`, `title`, `fullText`, `subItems`, `pageNumber`, `boundingBox`, `internalReferences`).
  - `attachments` (array): Załączniki (`name`, `presentInDocument`, `pageNumber`).
  - `definitions` (record): Słownik pojęć zdefiniowanych w umowie.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage03-segmentation.ts`
  - JSON Schema: `docs/schemas/stage03-segmentation.json`

---

## 4. Etap 4: CHECKLISTA (`stage04-checklist`)
- **Cel:** Dopasowanie klauzul do stałych punktów kontrolnych dla danego typu umowy i wykrycie braków.
- **Kluczowe pola:**
  - `contractType` (enum): Typ badanej umowy.
  - `totalItemsChecked` (int): Liczba punktów kontrolnych.
  - `matches` (array): Przypisania klauzul do punktów checklisty (`checklistItemId`, `matchedClauseIds`, `isMissing`, `missingRiskSeverity`).
  - `unmatchedClauseIds` (array): Klauzule poza standardową checklistą (kierowane do ogólnej weryfikacji abuzywności).
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage04-checklist.ts`
  - JSON Schema: `docs/schemas/stage04-checklist.json`

---

## 5. Etap 5: RETRIEVAL (`stage05-retrieval`)
- **Cel:** Wyszukanie w `legal-kb/` wyłącznie autorytatywnych jednostek prawnych (przepisów, wpisów UOKiK, orzeczeń) dla badanych punktów.
- **Kluczowe pola:**
  - `contexts` (array): Konteksty prawne dla klauzul (`clauseId`, `checklistItemId`, `retrievedUnits`).
  - `retrievedUnits` (array): Jednostki prawne (`id`, `unitType`, `actTitle`, `editorialUnit`, `content`, `sourceUrl`, `legalStateDate`, `status`).
  - `allRetrievedUnitIds` (array): Lista ID pobranych źródeł.
  - `missingRequiredSources` (array): Zgłoszenie brakujących źródeł w KB (flaga bezpieczeństwa).
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage05-retrieval.ts`
  - JSON Schema: `docs/schemas/stage05-retrieval.json`

---

## 6. Etap 6: OCENA RYZYKA (`stage06-evaluation`)
- **Cel:** Izolowana ocena klauzuli przez model LLM z dostępem WYŁĄCZNIE do pobranego kontekstu prawnego (zwraca ścisły JSON).
- **Kluczowe pola:**
  - `ocena` (enum): `czerwony`, `żółty`, `zielony`.
  - `tytulPoLudzku` (string): Krótki, zrozumiały nagłówek (do 120 znaków).
  - `doslownyCytatZUmowy` (string): Dokładny fragment klauzuli stanowiący podstawę zarzutu.
  - `uzasadnienie` (string): Objaśnienie skutków prawnych prostym językiem (ISO 24495-1).
  - `zrodlaIds` (array): Identyfikatory jednostek z `legal-kb/` (minimum 1 źródło).
  - `pewnosc` (number: 0.0 - 1.0): Poziom pewności oceny.
  - `kwotaRyzyka` (number): Oszacowana kwota ryzyka (jeśli mierzalna).
  - `zalozeniaKwoty` (string): Precyzyjny opis założeń (np. „przy 3 miesiącach wypowiedzenia i czynszu 3000 zł”).
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage06-evaluation.ts`
  - JSON Schema: `docs/schemas/stage06-evaluation.json`

---

## 7. Etap 7: WALIDACJA ŹRÓDEŁ I CYTATÓW (`stage07-validation`)
- **Cel:** Deterministyczny audyt przez kod silnika: eliminacja halucynacji i nieistniejących przepisów.
- **Kluczowe pola:**
  - `status` (enum): `verified`, `needs_verification`, `rejected`.
  - `cytatZweryfikowany` (boolean): Potwierdzenie, że cytat występuje dosłownie w dokumencie.
  - `zweryfikowaneZrodlaIds` (array): Źródła istniejące w `legal-kb/` ze statusem `active`.
  - `odrzuconeZrodlaIds` (array): Źródła nieistniejące lub uchylone.
  - `isGroundingClean` (boolean): `true` tylko wtedy, gdy 100% źródeł jest w pełni zweryfikowanych.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage07-validation.ts`
  - JSON Schema: `docs/schemas/stage07-validation.json`

---

## 8. Etap 8: BENCHMARK RYNKOWY (`stage08-benchmark`)
- **Cel:** Porównanie parametrów umowy ze statystykami rynkowymi przy zachowaniu rygoru próby (N >= 50).
- **Kluczowe pola:**
  - `paramKey` (string): Identyfikator parametru (np. `kaucja_wielokrotnosc_czynszu`).
  - `sampleSize` (int): Liczebność próby w bazie benchmarków.
  - `hasSufficientSample` (boolean): `true` dla N >= 50 (wymóg etykietowania).
  - `classification` (enum): `standard_rynkowy`, `odbiega_od_normy`, `skrajny`, `brak_danych`.
  - `explanation` (string): Rzeczowy opis porównania.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage08-benchmark.ts`
  - JSON Schema: `docs/schemas/stage08-benchmark.json`

---

## 9. Etap 9: AGREGACJA I RAPORT (`stage09-aggregation`)
- **Cel:** Synteza kompletnego raportu świetlnego dla użytkownika.
- **Kluczowe pola:**
  - `verdictOneSentence` (string): Jednozdaniowy werdykt (np. „Można podpisać po zmianie §4 i wykreśleniu kary umownej”).
  - `counts` (object): Liczba uwag czerwonych, żółtych, braków i zielonych.
  - `totalRiskAmount` (number): Sumaryczne policzone ryzyko finansowe.
  - `recommendedAction` (enum): `mozesz_podpisac`, `popros_o_zmiany`, `negocjuj`, `skonsultuj_z_prawnikiem`.
  - `findings` (object): Podział na kategorie `red`, `yellow`, `missing`, `green`.
  - `meta` (object): Oznaczenie AI Act, data analizy, wersje baz.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage09-aggregation.ts`
  - JSON Schema: `docs/schemas/stage09-aggregation.json`

---

## 10. Etap 10: GENEROWANIE POPRAWEK I MAILI (`stage10-generation`)
- **Cel:** Przygotowanie gotowych materiałów do negocjacji dla użytkownika.
- **Kluczowe pola:**
  - `amendments` (array): Propozycje nowego brzmienia klauzul w wersji miękkiej (`softReplacementText`) i stanowczej (`firmReplacementText`), wraz z uzasadnieniem prawnym (`legalRationale`).
  - `negotiationEmail` (object): Gotowa treść wiadomości e-mail do drugiej strony umowy w wersji dyplomatycznej i stanowczej, z punktowaną listą zmian i linkiem `mailto:`.
  - `exportCapabilities` (object): Flagi wsparcia eksportu DOCX ze śledzeniem zmian i natywnego wydruku PDF.
- **Pliki:**
  - Zod: `src/pipeline/schemas/stage10-generation.ts`
  - JSON Schema: `docs/schemas/stage10-generation.json`
