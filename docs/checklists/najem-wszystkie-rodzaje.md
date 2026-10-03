# Checklista weryfikacji umów najmu (Wszystkie rodzaje)

Status: **Szkic (draft) — do zatwierdzenia przez radcę prawnego / adwokata**  
Wersja: **2026.10-draft**  
Zgodność z `legal-kb/`: **100% identyfikatorów powiązanych z autentycznymi aktami z Sejm ELI API / ISAP / UOKiK / SN**

---

## 1. Najem lokalu mieszkalnego (zwykły) — `najem_lokalu_mieszkalnego`
Zastosowanie: umowy zawierane między osobami fizycznymi lub firmami a lokatorami na zasadach ogólnych ustawy o ochronie praw lokatorów i Kodeksu cywilnego.

| ID punktu | Obszar | Pytanie kontrolne | Czerwona flaga | Kryterium żółte | Kryterium zielone | Źródła prawne |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `najem-kaucja-limit` | Kaucja | Czy kaucja mieści się w limicie ustawowym? | Kaucja > 12x miesięczny czynsz | Kaucja > 2x czynsz | 1x–2x czynsz | `uopl-art-6` |
| `najem-kaucja-termin-zwrotu` | Kaucja | Czy termin zwrotu kaucji <= 30 dni? | Brak terminu lub > 30 dni | Brak w umowie (ryzyko) | Do 30 dni od zwrotu lokalu | `uopl-art-6` |
| `najem-kaucja-przepadek` | Kaucja | Czy brak klauzuli przepadku kaucji? | Automatyczny przepadek kaucji | Potrącenia bez dowodu szkody | Pokrycie udowodnionych szkód | `uopl-art-6`, `kc-art-385-1`, UOKiK 2045, SN III CZP 52/19 |
| `najem-kaucja-waloryzacja` | Kaucja | Czy zagwarantowano waloryzację kaucji? | Wyłączenie waloryzacji | Brak wzmianki o waloryzacji | Zwrot zwaloryzowanej kaucji | `uopl-art-6` |
| `najem-wypowiedzenie-katalog-przyczyn` | Wypowiedzenie | Czy przyczyny zgodne z art. 11 UoPL? | Pozakatalogowe przyczyny lub skrócone terminy | Niejasne sformułowania | Wyłącznie art. 11 UoPL | `uopl-art-11`, SN III CZP 11/13 |
| `najem-wypowiedzenie-zaleglosc-czynszowa` | Wypowiedzenie | Czy zachowano procedurę ostrzegawczą? | Wypowiedzenie natychmiastowe za 1 m-c | Brak procedury w umowie | Zaległość 3 okresy + 1 m-c uprzedzenia | `uopl-art-11`, UOKiK 592 |
| `najem-czas-oznaczony-wazne-przyczyny` | Wypowiedzenie | Czy w umowie na czas oznaczony podano ważne przyczyny? | Brak przyczyn lub „z ważnych przyczyn” | Zbyt ogólny katalog | Zamknięty katalog obiektywnych zdarzeń | `kc-art-673`, SN V CSK 31/08 |
| `najem-termin-wypowiedzenia-lokalu` | Wypowiedzenie | Czy termin wypowiedzenia wynosi min. 3 m-ce? | Termin wynajmującego < 3 m-ce | Termin najemcy < 1 m-c | Min. 3 miesiące na koniec miesiąca | `kc-art-688` |
| `najem-podwyzka-czynszu-procedura` | Czynsz i opłaty | Czy podwyżka czynszu spełnia rygor UoPL? | Jednostronna natychmiastowa podwyżka | Brak wskaźnika GUS | Min. 3 miesiące + uzasadnienie kalkulacji | `uopl-art-8a`, `kc-art-685-1` |
| `najem-oplaty-niezalezne-rozliczenie` | Czynsz i opłaty | Czy media rozliczane według kosztów? | Prowizje manipulacyjne wynajmującego | Brak rachunków do wglądu | Ściśle wg faktur i liczników | `uopl-art-9` |
| `najem-kara-umowna-opoznienie` | Czynsz i opłaty | Czy brak kary umownej za opóźnienie w czynszu? | Kara umowna za opóźnienie pieniężne | Odsetki > odsetki maksymalne | Wyłącznie odsetki ustawowe | `kc-art-385-3`, UOKiK 2487 |
| `najem-protokol-zdawczo-odbiorczy` | Naprawy i stan | Czy przewidziano protokół zdawczo-odbiorczy? | Fikcyjne oświadczenie o braku wad | Brak protokołu przy zwrocie | Protokół przed i po z licznikami | `uopl-art-6c`, `kc-art-675`, SN III CZP 52/19 |
| `najem-naprawy-podzial-obowiazkow` | Naprawy i stan | Czy podział napraw odpowiada art. 6a i 6b UoPL? | Przerzucenie napraw głównych na lokatora | Niejasny podział drobnych napraw | Wynajmujący: główne; Lokator: bieżące | `uopl-art-6a`, `uopl-art-6b`, `kc-art-662`, `kc-art-663`, `kc-art-681` |
| `najem-wylaczenie-rekojmi` | Naprawy i stan | Czy nie wyłączono uprawnień z rękojmi? | Zrzeczenie się roszczeń z wad lokalu | Wyłączenie za awarie | Prawo do obniżenia czynszu i naprawy | `kc-art-664`, `kc-art-385-1`, UOKiK 6124 |
| `najem-wizyty-wlasciciela-inspekcja` | Prawa lokatora | Czy wizyty właściciela wymagają obecności najemcy? | Wstęp pod nieobecność w każdym czasie | Wizyty z krótkim uprzedzeniem | Za uprzedzeniem 24-48h w obecności | `kc-art-385-1`, UOKiK 4991 |
| `najem-zakazy-niedozwolone` | Prawa lokatora | Czy brak zakazów naruszających dobra osobiste? | Zakaz zamieszkania z dziećmi | Bezwzględny zakaz zwierząt z karą | Poszanowanie miru domowego | `kc-art-385-1`, `uopl-art-2` |

---

## 2. Najem okazjonalny lokalu — `najem_okazjonalny`
Zastosowanie: umowy zawierane przez osoby fizyczne nieprowadzące działalności w zakresie najmu, z rygorem eksmisji na podstawie aktu notarialnego (art. 19a–19e UoPL).

| ID punktu | Obszar | Pytanie kontrolne | Czerwona flaga | Kryterium żółte | Kryterium zielone | Źródła prawne |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `okazjonalny-status-wynajmujacego` | Wymogi formalne | Czy wynajmujący to osoba fizyczna bez działalności najmu? | Spółka lub przedsiębiorca jako wynajmujący | Brak oświadczenia w umowie | Osoba fizyczna nieprowadząca działalności najmu | `uopl-art-19a` |
| `okazjonalny-oswiadczenie-notarialne-777` | Załączniki | Czy określono rygor egzekucji z art. 777 kpc? | Pokrycie 100% kosztów narzucone arbitralnie | Termin < 7 dni na dostarczenie | Oświadczenie notarialne o poddaniu się egzekucji | `uopl-art-19a` |
| `okazjonalny-wskazanie-lokalu-zastepczego` | Załączniki | Czy załączono wskazanie lokalu zastępczego? | Brak wskazania lokalu zastępczego | Brak terminu 21 dni na zmianę lokalu | Wskazanie lokalu ze zgodą właściciela | `uopl-art-19a` |
| `okazjonalny-zgoda-wlasciciela-lokalu` | Załączniki | Czy podpis właściciela lokalu poświadczony notarialnie? | Zwykła forma pisemna zgody | Brak numeru księgi wieczystej | Zgoda z podpisem notarialnie poświadczonym | `uopl-art-19a` |
| `okazjonalny-kaucja-limit-6x` | Kaucja | Czy kaucja <= 6x miesięczny czynsz? | Kaucja > 6-krotność czynszu (art. 19c) | Kaucja > 2x czynsz | 1x–2x czynsz (maks. 6x) | `uopl-art-19c` |
| `okazjonalny-obowiazek-zgloszenia-us` | Wymogi formalne | Czy zobowiązano do zgłoszenia do US w 14 dni? | Zastrzeżenie zwalniające ze zgłoszenia | Brak potwierdzenia dla najemcy | Zgłoszenie do US w 14 dni z potwierdzeniem | `uopl-art-19b` |
| `okazjonalny-czas-oznaczony-limit-10-lat` | Czas trwania | Czy umowa zawarta na czas oznaczony do 10 lat? | Czas nieoznaczony lub > 10 lat | Zbliżony do 10 lat | Czas oznaczony do 10 lat (np. 1 rok) | `uopl-art-19a` |
| `okazjonalny-wylaczenie-przepisow-ochronnych` | Prawa stron | Czy wyłączenia są zgodne z art. 19e UoPL? | Rozszerzenie wyłączeń ponad art. 19e | Brak pouczenia o braku lokalu socjalnego | Prawidłowe odwołanie do art. 19e UoPL | `uopl-art-19e` |

---

## 3. Najem instytucjonalny lokalu — `najem_instytucjonalny`
Zastosowanie: umowy zawierane przez podmioty gospodarcze (firmy PRS, fundusze, przedsiębiorcy) w ramach działalności gospodarczej (art. 19f–19k UoPL).

| ID punktu | Obszar | Pytanie kontrolne | Czerwona flaga | Kryterium żółte | Kryterium zielone | Źródła prawne |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `instytucjonalny-status-wynajmujacego` | Status stron | Czy wynajmujący prowadzi działalność w zakresie najmu? | Osoba prywatna zawierająca najem instytucjonalny | Brak danych rejestrowych NIP/KRS | Przedsiębiorca prowadzący działalność najmu | `uopl-art-19f` |
| `instytucjonalny-oswiadczenie-notarialne` | Załączniki | Czy załączono oświadczenie bez lokalu zastępczego? | Wymóg wskazywania lokalu zastępczego | Krótki termin na notariusza | Akt notarialny poddania się egzekucji bez lokalu zastępczego | `uopl-art-19g` |
| `instytucjonalny-kaucja-limit-6x` | Kaucja | Czy kaucja mieści się w limicie 6x czynsz? | Kaucja > 6-krotność czynszu | Kaucja > 2x czynsz | Do 6-krotności czynszu | `uopl-art-19h` |
| `instytucjonalny-kaucja-zaspokojenie-biezace` | Kaucja | Czy uregulowano zaspokajanie należności w trakcie? | Zaspokajanie spornych kwot bez wezwania | Termin na uzupełnienie < 7 dni | Wezwanie z terminem min. 7 dni na uzupełnienie | `uopl-art-19h` |
| `instytucjonalny-wypowiedzenie-opróżnienie-termin` | Rozwiązanie | Czy termin opróżnienia lokalu wynosi min. 14 dni? | Termin opróżnienia < 14 dni od doręczenia | Niejasny tryb doręczenia | Termin min. 14 dni z poświadczonym podpisem | `uopl-art-19i` |
| `instytucjonalny-klauzule-abuzywne-b2c` | Abuzywność | Czy wzorzec umowny nie narusza praw konsumenta? | Jednostronna zmiana regulaminów, wyłączenie rękojmi | Arbitralny sąd właściwy | Zgodność z art. 385¹ k.c. i rejestrem UOKiK | `kc-art-385-1`, `kc-art-385-3`, UOKiK 4991, 2487, 2045, TSUE C-229/19 |

---

## 4. Najem lokalu użytkowego / komercyjnego — `najem_lokalu_uzytkowego`
Zastosowanie: umowy najmu lokali biurowych, handlowych, usługowych i magazynowych na gruncie Kodeksu cywilnego (B2B).

| ID punktu | Obszar | Pytanie kontrolne | Czerwona flaga | Kryterium żółte | Kryterium zielone | Źródła prawne |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `uzytkowy-przeznaczenie-lokalu` | Przedmiot | Czy precyzyjnie określono profil działalności? | Zakaz zamierzonej działalności / brak zgody | Zbyt wąski katalog usług | Pełna zgoda na zamierzoną działalność | `kc-art-659`, `kc-art-666` |
| `uzytkowy-wypowiedzenie-zaleglosc-art-687` | Rozwiązanie | Czy wypowiedzenie za zwłokę spełnia art. 687 k.c.? | Natychmiastowe wypowiedzenie za kilka dni | Dodatkowy termin < 1 miesiąc | Zwłoka min. 2 pełne okresy + 1 m-c uprzedzenia | `kc-art-687` |
| `uzytkowy-czas-oznaczony-przyczyny-wypowiedzenia` | Rozwiązanie | Czy w umowie na czas oznaczony podano ważne przyczyny? | Wypowiedzenie „z ważnych przyczyn” bez definicji | Prawo wypowiedzenia tylko dla wynajmującego | Precyzyjne, symetryczne przesłanki wypowiedzenia | `kc-art-673`, SN V CSK 31/08 |
| `uzytkowy-naklady-adaptacja-zwrot` | Nakłady | Czy uregulowano zasady adaptacji i zwrotu ulepszeń? | Pozostawienie ulepszeń bez wynagrodzenia | Obowiązek natychmiastowego demontażu | Zasady amortyzacji i odkupu nakładów | `kc-art-675`, `kc-art-677`, `kc-art-684` |
| `uzytkowy-kaucja-gwarancja-bankowa` | Finanse | Czy zasady zwrotu kaucji/gwarancji są precyzyjne? | Bezwarunkowy przepadek kaucji na żądanie | Termin zwrotu > 30 dni od protokołu | Zwrot w ciągu 14–30 dni od protokołu | `kc-art-659`, SN III CZP 52/19 |
