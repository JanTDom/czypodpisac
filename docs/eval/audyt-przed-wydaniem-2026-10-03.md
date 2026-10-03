# Audyt przed wydaniem — 2026-10-03

Commit audytowany: `5981f47` (gałąź `feature/etap-0-konfiguracja-i-etap-1-architektura`).
Procedura: `.agents/workflows/audyt-przed-wydaniem.md` oraz skill `ewaluacja-jakosci-prawnej`.

## Decyzja

**NIE WYDAWAĆ.** Produkt w obecnym stanie może powiedzieć użytkownikowi „PODPISZ: Umowa jest bezpieczna” o umowie, której w ogóle nie przeczytał. To łamie obietnicę produktu i zasadę 1 z `AGENTS.md`.

## Blokery

Kolejność według szkody dla użytkownika.

| # | Bloker | Dowód |
|---|--------|-------|
| B1 | Zdjęcie lub PDF umowy daje werdykt „PODPISZ”. Interfejs nie wyciąga tekstu z PDF, DOCX ani zdjęć: PDF jest czytany jako tekst (`file.text()` w `src/app/page.tsx`), a aparat wysyła tylko napisy „Strona 1”, „Strona 2”. | `POST /api/analyze` z tekstem, który wysyła aparat → `PODPISZ: Umowa jest bezpieczna…`; to samo dla pliku PDF czytanego jako tekst. |
| B2 | Silnik nie wywołuje Gemini. Ocena i „weryfikator” to reguły w kodzie (wyrażenia regularne i słowa kluczowe). Zasada 3 (niezależna weryfikacja osobnym wywołaniem modelu) nie jest spełniona. | `grep` w `src`: brak jakiegokolwiek wywołania Vertex AI / Gemini. |
| B3 | Silnik przepuszcza oczywiste wady. Wykrycie uwag czerwonych: 11 z 14 (78,6%). Kaucja 20-krotna zapisana jako „Kaucja zabezpieczająca wynosi 50000 zł” daje werdykt „PODPISZ”. Jednostronna zmiana czynszu nie jest wykrywana w żadnym przypadku. | `npm run eval` → `docs/eval/eval-najem-lokalu-mieszkalnego.json`, przypadki `nm-05`, `nm-07`, `nm-08`. |
| B4 | Zmyślone dane w produkcie. Benchmark rynkowy podaje „N=1420” i „78% umów” bez żadnego źródła (`src/pipeline/stages/stage08-benchmark.ts`). Panel admina pokazuje wpisane na sztywno liczby: koszt 0,038 zł, „-72% dzięki Context Caching”, 1,2 s, 2,8 s, „wskaźnik zaufania 99,4%” (`src/components/admin-dashboard.tsx`). | `grep` po tych wartościach. Żadna z nich nie pochodzi z pomiaru. |
| B5 | Orzeczenia i wpisy UOKiK w `legal-kb/` bez potwierdzonego źródła: 9 z 9. Adresy SN zwracają stronę błędu (HTML ok. 1,9 kB), adresy rejestru UOKiK zwracają 404, CURIA odmawia dostępu automatom (403). Treść tych wpisów nie jest potwierdzona z oficjalnego dokumentu. | `npm run audit:kb` → `docs/eval/kb-grounding-audit.json`. |
| B6 | Uzasadnienia prawne przesadzone wobec brzmienia przepisu. Art. 385³ k.c. to katalog postanowień niedozwolonych „w razie wątpliwości”, a jego skutkiem jest brak związania konsumenta (art. 385¹), nie nieważność. Tymczasem silnik pisze, że kara za wypowiedzenie „jest sprzeczna z art. 385³ pkt 16” i jest „bezwzględnie nieważna”. Punkt 16 dotyczy sumy płaconej „wyłącznie” przez konsumenta, a punkt 20 dotyczy podwyższenia ceny bez prawa odstąpienia. Szablon poprawki twierdzi ponadto, że klauzula jest „wpisana do rejestru klauzul niedozwolonych UOKiK”, bez wskazania wpisu. | Porównanie z treścią `legal-kb/akty/kc/kc-art-385-3.json` (potwierdzoną z ELI). Wymaga oceny prawnika. |
| B7 | Płatny raport dostępny bez płacenia. `POST /api/analyze` z `isPaid: true` zwraca poprawki i mail. Płatność BLIK to symulacja (`setTimeout` w `paywall-modal.tsx`), a modal nie woła nawet `/api/paywall/blik`. | Żądanie z `isPaid: true` → odpowiedź zawiera `generation`. |
| B8 | Panel admina dostępny publicznie i podlinkowany w nagłówku strony. | `GET /admin` → 200 bez logowania. |
| B9 | Brak nagłówków bezpieczeństwa (CSP, HSTS, X-Frame-Options, Referrer-Policy) i brak limitów. 30 żądań z rzędu przechodzi, 5 MB tekstu jest przyjmowane. | `curl -I`, pętla 30 żądań, żądanie 5 MB. |
| B10 | Przyciski „Pobierz DOCX” i „Raport PDF” nic nie robią (brak obsługi kliknięcia). „Konsultacja z prawnikiem” to tylko link `mailto`. | `src/components/amendments-and-email.tsx`, `src/components/report-view.tsx`. |
| B11 | Brak wykrywania niedołączonych załączników. Załącznik jest uznawany za obecny, jeśli jego nazwa pada w tekście. | `nm-16`: wykryto 0 z 1. |
| B12 | Dostępność: 4 naruszenia kontrastu (białe etykiety na tle bursztynowym). Przy szerokości 360 px nagłówek wychodzi poza ekran (przewijanie w poziomie, ucięty link). Terminy prawne nie mają objaśnień po dotknięciu (wymóg reguły 04). | axe-core 4.10.2 na `/`: 1 typ naruszenia (`color-contrast`, 4 elementy), 22 testy zaliczone. Zrzut ekranu 360×780. |
| B13 | RODO: automatyczne usuwanie istnieje tylko w `docs/schema.sql`. Aplikacja nie ma bazy danych, więc usuwanie nie działa. Zgłoszenia „Nie zgadzam się” trzymane są w pamięci procesu. | Przegląd kodu `src/app/api/*`. |

## Co działa

- Treść 61 z 61 przepisów w `legal-kb/akty` zgadza się z oficjalnym tekstem z API Sejmu ELI (próg 90% zgodności fragmentów). Uwaga: kodeks cywilny jest zapisany wg tekstu jednolitego Dz.U. 2024 poz. 1061. Wcześniejszy audyt aktualności wykrył nowszy tekst jednolity, więc jednostki trzeba odświeżyć.
- Uwagi w raportach powołują wyłącznie przepisy potwierdzone z ELI (0 niepotwierdzonych źródeł w uwagach na zbiorze testowym).
- W umowach poprawnych werdykt jest poprawny w 5 z 5 przypadków (w tym granica 12-krotności kaucji). Nie ma fałszywych czerwonych alarmów.
- Polecenie ukryte w treści umowy nie zmieniło wyniku (`nm-12`). Silnik nie używa jednak modelu językowego, więc ten test nie mówi nic o odporności przyszłej wersji z Gemini.
- Typy (`tsc --noEmit`), testy jednostkowe (62 z 62), build produkcyjny: zaliczone.

## Czego nie sprawdzono

- Lint: projekt nie ma skonfigurowanego ESLint.
- Testy E2E desktop i mobile, czytnik ekranu, pełna obsługa klawiatury: brak Playwright. Sprawdzono tylko ekran startowy w axe.
- Lighthouse i Core Web Vitals: nie uruchomiono.
- RLS: brak podłączonej bazy, nie ma czego testować.
- Zbiór testowy obejmuje tylko najem lokalu mieszkalnego (17 umów). Skill wymaga minimum 15 umów na każdy aktywny typ, a aktywne są cztery typy najmu. Oczekiwane wyniki nie są zatwierdzone przez prawnika.

## Jak powtórzyć

```
npm run audit:kb   # ugruntowanie legal-kb w źródłach (kod 1 = są niepotwierdzone wpisy)
npm run eval       # ewaluacja prawna i bramki wydania
npm test           # testy jednostkowe
```

## Stan blokerów po poprawkach (2026-10-03, wieczór)

| Nr | Stan | Co zrobiono |
|---|---|---|
| B1 | obejście | Interfejs przyjmuje tylko wklejony tekst i pliki .txt; przycisk aparatu ukryty. Serwer odrzuca (422) tekst z podpisami stron i pliki binarne. Odczyt PDF, DOCX i zdjęć nadal do zrobienia. |
| B2 | częściowo | Klient Gemini Vertex UE istnieje (`src/llm/gemini-client.ts`), ale silnik go jeszcze nie wywołuje. |
| B4 | zamknięty | Benchmark bez median; panel admina tylko z danymi z konfiguracji i plików audytu. Test `no-fabricated-data`. |
| B6 | zamknięty | Commit ea62604. |
| B7 | zamknięty | API ignoruje `isPaid` (402). `/api/paywall/blik` nie potwierdza płatności (503), bo bramka nie jest podłączona. |
| B8 | zamknięty | `/admin` i odczyt `/api/feedback` za HTTP Basic (`ADMIN_PASSWORD`); bez zmiennej 404. Link usunięty z nagłówka. |
| B9 | zamknięty z zastrzeżeniem | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. Limit 200 000 znaków i 10 analiz na minutę na IP. Limit liczy się w pamięci jednej instancji. |
| B3, B5, B10–B13 | otwarte | Bez zmian. |
