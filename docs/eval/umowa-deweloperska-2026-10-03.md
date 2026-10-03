# Umowa deweloperska — ewaluacja i lista „do weryfikacji” (2026-10-03)

Workflow `/nowy-typ-umowy`, etap 6. Typ umowy: **umowa deweloperska**. Grupa docelowa: osoba fizyczna kupująca od dewelopera mieszkanie lub dom poza działalnością gospodarczą („nabywca”, art. 5 pkt 5 ustawy).

**Status: szkic, nieaktywny.** Checklista nie jest zarejestrowana w domyślnym rejestrze (`ChecklistRegistry.registerDefaults()`), więc produkcyjny silnik ocenia umowy deweloperskie jak dotąd: tylko checklistą uniwersalną. Aktywacja wymaga zatwierdzenia przez prawnika (krok 7 workflow).

## Źródło prawa

- Ustawa z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym, tekst jednolity **Dz.U. 2026 poz. 880** (obwieszczenie z 12 czerwca 2026 r., stan prawny na 9 czerwca 2026 r.).
- Najnowszość tekstu sprawdzona w API Sejmu: `GET https://api.sejm.gov.pl/eli/acts/DU/2021/1177` → teksty jednolite DU/2024/695 i DU/2026/880.
- API nie udostępnia tego tekstu w HTML (`textHTML: false`, `text.html` zwraca 0 B). Treść czytamy z oficjalnego PDF (`/eli/acts/DU/2026/880/text.pdf`) kodem `scripts/lib/eli-pdf-text.mjs`.
- Zmiany już uchwalone, jeszcze nieobowiązujące:
  - Dz.U. 2026 poz. 1077 (wejście w życie 11 listopada 2026 r.) zmienia wyłącznie art. 19b — nie dotyczy pobranych jednostek.
  - Część zmian z Dz.U. 2025 poz. 1669 z odroczonym terminem dotyczy art. 50–52 (Ewidencja) — nie dotyczy pobranych jednostek.
- Pobrane jednostki (23): art. 5 pkt 5–6, 5a, 6, 8, 14, 21, 23, 24, 25, 29, 30, 31, 32, 34, 35, 39, 40, 41, 41a, 42, 43, 44 ust. 1–3, 45. Pliki: `legal-kb/akty/deweloperska/dew-art-*.json`.
- Audyt ugruntowania (`npm run audit:kb`): 23/23 nowych jednostek potwierdzonych, każda w 100% fragmentów zgodna z oficjalnym tekstem.

## Zaostrzenie audytu ugruntowania

Test kontrolny: zmiana w `dew-art-32` jednej liczby („1 %” → „5 %”) **przechodziła** audyt z progiem 90%. Audyt wymaga teraz zgodności wszystkich fragmentów po 12 słów, łącznie z ostatnim. Po zmianie ta sama podmiana daje „niepotwierdzona, 90,9%, fragmenty niezgodne: 1”. Wszystkie 84 jednostki aktów (61 dotychczasowych + 23 nowe) mają 100,0%.

## Wyniki ewaluacji (`npm run eval`)

Raport maszynowy: `docs/eval/eval-umowa-deweloperska.json`. Zbiór: `test-contracts/umowa-deweloperska.json` (20 przypadków: 1 poprawny, 13 zasianych wad, 1 granica, 3 odporność, 2 wady poza regułami).

| Metryka | Wynik |
|---|---|
| Wykrycie uwag czerwonych (recall) | 17/19 = 0,895 |
| Fałszywe uwagi czerwone | 0 |
| Trafność werdyktu | 18/20 = 0,90 |
| Werdykt na umowach bez wad (oczekiwane „PODPISZ”: dw-01, dw-05, dw-08, dw-17) | 4/4 = 1,00 |
| Dokładność kwot | 5/5 = 1,00 |
| Źródła niepotwierdzone w uwagach | 0 |
| Oczekiwania zatwierdzone przez prawnika | nie |

Przeoczone:
- **dw-19** — odsetki dla dewelopera wyższe niż kary dla nabywcy (art. 39 ust. 1). Brak reguły porównującej stawki.
- **dw-20** — część ceny „bezpośrednio Deweloperowi przelewem”. Reguła rachunku powierniczego szuka tylko „rachunek bieżący”, „gotówka”, „w kasie”.

Zbiór najmu po zmianach: bez zmian wobec etapu 5 (recall 11/14 = 0,786, te same 3 przeoczenia), bramka „brak spadku” zielona.

> [!WARNING]
> Wynik 0,895 jest zawyżony. Zbiór testowy i reguły napisał ten sam agent, tymi samymi sformułowaniami. Na prawdziwych umowach wykrywalność będzie niższa. Wiarygodną miarą będzie dopiero zbiór przygotowany lub zatwierdzony przez prawnika, najlepiej z prawdziwych umów deweloperskich.

## Co silnik robi dla tego typu (reguły deterministyczne)

Plik `src/pipeline/rules/umowa-deweloperska-rules.ts`. Działają tylko przy zarejestrowanej checkliście.

| Reguła | Próg | Przepis |
|---|---|---|
| Opłata rezerwacyjna powyżej 1% ceny | 1% | art. 32 ust. 2 |
| Wpłaty poza rachunkiem powierniczym | — | art. 6 ust. 1, art. 8 ust. 1 |
| Koszty rachunku powierniczego po stronie nabywcy | — | art. 14, art. 42 |
| Zapłata lub potrącenie za odstąpienie nabywcy | — | art. 44 ust. 1–2, art. 42 |
| Odstąpienie dewelopera bez 30-dniowego wezwania | 30 dni | art. 43 ust. 7, art. 42 |
| Termin dodatkowy dłuższy niż 120 dni | 120 dni | art. 43 ust. 3, art. 42 |
| Odpowiedź na wady później niż 14 dni / usunięcie później niż 30 dni | 14 / 30 dni | art. 41 ust. 4 i 6, art. 42 |
| Koszty notarialne umowy deweloperskiej tylko po stronie nabywcy | — | art. 40 ust. 2, art. 42 |
| Forma pisemna bez śladu notariusza | — | art. 40 ust. 1 |

## Do weryfikacji (prawnik)

1. **Wszystkie 15 punktów checklisty** (`src/checklists/umowa-deweloperska.ts`) — kryteria czerwone, żółte, zielone i teksty dla użytkownika. Status: `draft`.
2. **Zakres art. 44 ust. 1–2.** Reguła traktuje każdą zapłatę za odstąpienie nabywcy jako ryzyko czerwone. Przepis dotyczy odstąpienia z art. 43 ust. 1. Uzasadnienie mówi to wprost i prosi o ocenę prawnika. Czy taki zapis ocenić czerwono, gdy obejmuje też inne przypadki odstąpienia?
3. **Opłata rezerwacyjna liczona od ceny z umowy.** Ustawa liczy limit od ceny z prospektu. Silnik nie ma prospektu i pisze to w założeniach kwoty. Czy to wystarcza?
4. **Koszty notarialne.** Reguła pomija zapisy o umowie przenoszącej własność (art. 40 ust. 2 dotyczy zawierania umowy deweloperskiej). Do potwierdzenia, że to właściwe zawężenie.
5. **Forma umowy.** Czy umowę bez aktu notarialnego oceniać jako „PODPISZ PO ZMIANACH” (obecny werdykt), czy „NIE PODPISUJ BEZ PRAWNIKA”? Silnik nie waży powagi uwag, liczy ich liczbę i kwotę.
6. **Oczekiwane wyniki 20 przypadków testowych** (`lawyerApproved: false`).
7. **Art. 39 ust. 1 (odsetki a kary)** — brak reguły; do decyzji, jak liczyć porównanie (stawka dzienna, podstawa, okres).
8. **Wpisy UOKiK i orzecznictwo dla umów deweloperskich — nie dodano żadnych.** Istniejące 9 wpisów w bazie jest niepotwierdzonych (bloker B5), a dla tego typu nie mam źródła, które da się automatycznie potwierdzić. Potrzebna decyzja, skąd je brać (np. ręczny wybór przez prawnika z rejestru UOKiK i portalu orzeczeń).
9. **Zakres warstwy A.** Nie pobrano art. 1–4, 7, 9–13, 15–20, 22, 26–28, 33, 36–38 i rozdziałów 8–11. Do decyzji, czy są potrzebne dla tego typu (np. art. 36 dla umów z art. 2 ust. 1 pkt 2, 3 i 5).

## Ograniczenia odziedziczone po silniku (blokery z audytu 2026-10-03)

Nowy typ dziedziczy wszystkie otwarte blokery B1–B13 z `docs/eval/audyt-przed-wydaniem-2026-10-03.md`. Najważniejsze dla tego typu:
- B1 — zdjęcia i PDF nie są odczytywane; reguły działają tylko na wklejonym tekście.
- B2 — silnik nie wywołuje Gemini; ocenia tylko to, co opisują reguły.
- Etap 4 (dopasowanie checklisty) działa na słowach kluczowych. W poprawnej umowie testowej (dw-01) pokazuje fałszywy „brak: Forma umowy”, bo nagłówek z informacją o akcie notarialnym nie jest klauzulą z „§”. Dwa inne fałszywe braki („Odbiór i usuwanie wad”, „Twoje prawo odstąpienia”) usunąłem, upraszczając pytania kontrolne.
- Zdanie werdyktu „PODPISZ” brzmi „Umowa jest bezpieczna i nie zawiera klauzul abuzywnych ani istotnych ryzyk”. To twierdzenie mocniejsze, niż pozwalają reguły.
- Reguły liczą terminy tylko w dniach. Terminy w miesiącach lub tygodniach nie są oceniane.
