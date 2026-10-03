# Baza wiedzy prawnej czypodpisac.pl (legal-kb)

Dokument opisuje architekturę, źródła prawne, status rejestru klauzul UOKiK, mechanizm wersjonowania w czasie oraz podział na warstwy A, B i C.

---

## 1. Źródła prawne i hierarchia

Zgodnie z regułą `02-prawo-zrodla-aktualnosc.md` obowiązuje bezwzględny **ZAKAZ ZMYŚLANIA**:
1. **Akty prawne RP:** Oficjalne API Sejmu RP (ELI — Europejski Identyfikator Prawa: `https://api.sejm.gov.pl/eli`) oraz ISAP (`https://isap.sejm.gov.pl`). Pobierane teksty jednolite, akty nowelizujące i daty wejścia w życie.
2. **Prawo Unii Europejskiej:** Dyrektywa Rady 93/13/EWG z dnia 5 kwietnia 1993 r. w sprawie nieuczciwych warunków w umowach konsumenckich (EUR-Lex) oraz orzecznictwo TSUE (CURIA).
3. **Rejestr klauzul niedozwolonych i decyzje Prezesa UOKiK:** Oficjalne bazy Urzędu Ochrony Konkurencji i Konsumentów (`https://decyzje.uokik.gov.pl`).
4. **Orzecznictwo sądowe:** Sąd Najwyższy (`https://www.sn.pl`), Portale Orzeczeń Sądów Powszechnych oraz SAOS.
5. **Stanowiska urzędowe:** UOKiK, Rzecznik Finansowy, KNF, UODO — pomocniczo.

---

## 2. Status prawny rejestru klauzul niedozwolonych UOKiK

### Podstawa prawna i zmiana modelu kontroli (17 kwietnia 2016 r.)
W polskim systemie ochrony konsumentów funkcjonują dwa reżimy prawne dotyczące klauzul abuzywnych:
1. **Reżim historyczny (wpisy przed 17 kwietnia 2016 r.):**
   - Prowadzony przez Prezesa UOKiK na podstawie uchylonych przepisów art. 479³⁶–479⁴⁵ Kodeksu postępowania cywilnego (k.p.c.).
   - Wpisu dokonywano na mocy prawomocnego wyroku Sądu Okręgowego w Warszawie — Sądu Ochrony Konkurencji i Konsumentów (SOKiK).
   - *Skutek prawny (Uchwała składu 7 sędziów Sądu Najwyższego z dnia 20 listopada 2015 r., sygn. akt III CZP 17/15):* Prawomocność materialna wyroku wpisanego do rejestru działa na rzecz wszystkich konsumentów, ale wyłącznie przeciwko przedsiębiorcy, przeciwko któremu zapadł wyrok. Wobec innych przedsiębiorców stanowi silne domniemanie abuzywności tożsamych zapisów w obrocie konsumenckim.
2. **Reżim administracyjny (decyzje od 17 kwietnia 2016 r.):**
   - Ustawa z dnia 5 sierpnia 2015 r. o zmianie ustawy o ochronie konkurencji i konsumentów oraz niektórych innych ustaw (Dz.U. 2015 poz. 1634).
   - O abuzywności postanowienia wzorca umowy rozstrzyga bezpośrednio Prezes UOKiK w drodze decyzji administracyjnej (art. 23a–23d ustawy o ochronie konkurencji i konsumentów).
   - Prawomocna decyzja Prezesa UOKiK uznająca klauzulę za niedozwoloną ma skutek wobec danego przedsiębiorcy oraz wszystkich konsumentów, którzy zawarli z nim umowę. Ponadto decyzja publikowana jest w bazie decyzji UOKiK.

### Zastosowanie w czypodpisac.pl:
- Każda powoływana klauzula UOKiK zawiera: numer wpisu, pełną sygnaturę wyroku SOKiK lub decyzji Prezesa UOKiK, datę wpisu oraz bezpośredni URL do bazy UOKiK.
- W raporcie wpisy te służą jako dowód utrwalonej linii orzeczniczej organu ochrony konsumentów.

---

## 3. Warstwa A (Rdzeń bazy prawnej) — 17 aktów prawnych

Warstwa A obejmuje 17 podstawowych aktów regulujących prawo umów w Polsce. Akty te są monitorowane codziennie przez `LawFreshnessGuard`:

| Lp. | Skrót | Pełny tytuł aktu | Identyfikator ELI bazowy | Najnowszy tekst jednolity | Stan w bazie |
|---|---|---|---|---|---|
| 1 | **KC** | Kodeks cywilny | `DU/1964/93` | `DU/2023/1610` (nowela `DU/2026/795`) | Pobrany (kluczowe artykuły umów) |
| 2 | **UoPL** | Ustawa o ochronie praw lokatorów | `DU/2001/733` | `DU/2023/725` | Pobrany w całości (art. 2-19k) |
| 3 | **UOKiK-Kons** | Ustawa o prawach konsumenta | `DU/2014/827` | `DU/2023/2759` | Zarejestrowany (do pobrania pełnego) |
| 4 | **Deweloperska** | Ustawa o ochronie praw nabywcy lokalu i DFG | `DU/2021/1177` | `DU/2024/695` | Zarejestrowany (do pobrania pełnego) |
| 5 | **Kredyt-Kons** | Ustawa o kredycie konsumenckim | `DU/2011/540` | `DU/2023/1028` | Zarejestrowany (do pobrania pełnego) |
| 6 | **Kredyt-Hipot** | Ustawa o kredycie hipotecznym | `DU/2017/819` | `DU/2022/2245` | Zarejestrowany (do pobrania pełnego) |
| 7 | **Zatory** | Ustawa o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych | `DU/2013/403` | `DU/2023/1790` | Zarejestrowany (do pobrania pełnego) |
| 8 | **Autorskie** | Ustawa o prawie autorskim i prawach pokrewnych | `DU/1994/83` | `DU/2022/2509` (nowela `DU/2024/1254`) | Zarejestrowany (do pobrania pełnego) |
| 9 | **KP** | Kodeks pracy (kwalifikacja umów art. 22) | `DU/1974/141` | `DU/2023/1465` (nowela `DU/2026/1245`) | Pobrany (art. 22, 25, 29, 30, 101¹, 101²) |
| 10 | **Ubezpieczenia** | Ustawa o działalności ubezpieczeniowej i reasekuracyjnej | `DU/2015/1844` | `DU/2024/839` | Zarejestrowany (do pobrania pełnego) |
| 11 | **Płatności** | Ustawa o usługach płatniczych | `DU/2011/1146` | `DU/2024/30` | Zarejestrowany (do pobrania pełnego) |
| 12 | **PKE** | Prawo komunikacji elektronicznej | `DU/2024/1221` | — | Zarejestrowany (do pobrania pełnego) |
| 13 | **Turystyka** | Ustawa o imprezach turystycznych i powiązanych usługach | `DU/2017/2361` | `DU/2023/2211` | Zarejestrowany (do pobrania pełnego) |
| 14 | **Energetyka** | Prawo energetyczne | `DU/1997/358` | `DU/2024/266` | Zarejestrowany (do pobrania pełnego) |
| 15 | **RODO/UODO** | Ustawa o ochronie danych osobowych | `DU/2018/1000` | `DU/2019/1781` | Zarejestrowany (do pobrania pełnego) |
| 16 | **KSH** | Kodeks spółek handlowych | `DU/2000/1037` | `DU/2024/18` | Zarejestrowany (do pobrania pełnego) |
| 17 | **KPC** | Kodeks postępowania cywilnego (właściwość sądu, sąd polubowny) | `DU/1964/296` | `DU/2023/1550` | Zarejestrowany (do pobrania pełnego) |

---

## 4. Wersjonowanie w czasie

1. Każda jednostka redakcyjna w bazie posiada pole `legalStateDate` (data ogłoszenia lub wejścia w życie danej wersji).
2. Analiza umowy stosuje stan prawny na dzień jej zawarcia (`contractDate`):
   - `LegalKnowledgeBase.getUnitAtDate(id, contractDate)` weryfikuje, czy przepis wszedł w życie przed datą podpisania umowy.
   - Jeśli po zawarciu umowy przepis uległ nowelizacji, raport generuje ostrzeżenie o zmianie prawa w okresie trwania umowy.
   - Pytanie o datę umowy w interfejsie pojawia się wyłącznie wtedy, gdy umowa jest datowana inaczej niż „dziś”.

---

## 5. Mechanizm Warstwy B (Akty na żądanie)

Gdy analizowany dokument powołuje akt prawny spoza 17 aktów Rdzenia:
1. `LayerBService` pobiera metadane i treść HTML bezpośrednio z endpointu `api.sejm.gov.pl/eli`.
2. Parser automatycznie wyodrębnia jednostki redakcyjne (artykuły) i wylicza skróty SHA-256.
3. Jednostki otrzymują status `needs_review` („nieprzejrzane przez prawnika”) oraz tag `warstwa_b`.
4. Raport końcowy informuje użytkownika jednym zdaniem:
   *„Raport uwzględnia przepisy z aktu [Tytuł], pobranego automatycznie z oficjalnego rejestru Sejmu RP (ELI), które nie zostały jeszcze indywidualnie zweryfikowane przez prawnika.”*

---

## 6. Zadanie codziennej aktualizacji i synchronizacja z checklistami

Skrypt `scripts/check-law-updates.ts` wykonuje weryfikację każdego zarejestrowanego aktu w Sejmie RP:
1. Bada listę aktów zmieniających (`references["Akty zmieniające"]`) ogłoszonych po dacie stanu prawnego jednostki.
2. Bada pojawienie się nowych obwieszczeń o jednolitym tekście (`references["Inf. o tekście jednolitym"]`).
3. W przypadku wykrycia nowelizacji przełącza zależne punkty kontrolne checklist (`affectedChecklistItems`) w status `needs_review` / `do_przeglądu`.
4. Generuje pełny raport JSON w `docs/eval/law-freshness-audit.json`.
