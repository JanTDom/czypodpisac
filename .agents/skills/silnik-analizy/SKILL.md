---
name: silnik-analizy
description: Pipeline analizy umowy na Gemini — ingest PDF/zdjęć/DOCX, klasyfikacja, segmentacja klauzul, checklisty, retrieval prawny, ocena, weryfikacja, kwoty ryzyka, werdykt. Używaj przy każdej zmianie logiki analizy.
---
# Etapy (osobne funkcje, osobne testy)
1. INGEST: tekst + układ + mapa pozycji (do podświetleń). Zdjęcia: prostowanie, kontrola ostrości (zbyt nieczytelne → prośba o ponowne zdjęcie konkretnej strony), Gemini multimodalny + OCR, porównanie wyników.
2. KLASYFIKACJA: typ umowy (taksonomia w checklistach + „inny”), strony, rola użytkownika, status konsumenta, wartość, czas trwania, data. Pewność < progu → pytanie do użytkownika.
3. SEGMENTACJA: klauzule z identyfikatorami, definicje, odwołania wewnętrzne, załączniki, wzorce umowne (regulaminy, OWU) wskazane w umowie — jeśli niedołączone, zgłoś brak.
4. CHECKLISTA UNIWERSALNA (każda umowa): forma i podpisy; strony i reprezentacja; przedmiot i świadczenia; cena, waloryzacja, odsetki; terminy; jednostronna zmiana umowy lub ceny; automatyczne przedłużenie; wypowiedzenie i odstąpienie; kary umowne i ich górne granice; ograniczenia odpowiedzialności; zabezpieczenia (weksel, kaucja, poręczenie, poddanie się egzekucji); cesja; poufność i zakaz konkurencji; dane osobowe; właściwość sądu i zapis na sąd polubowny; prawo właściwe; wzorce umowne; klauzule potencjalnie abuzywne.
5. CHECKLISTA SPECJALNA dla typu umowy (skill checklisty-umow).
6. RETRIEVAL: wyszukiwanie hybrydowe (wektorowe + pełnotekstowe) w legal-kb z filtrami typu umowy i statusu strony; rerankowanie.
7. OCENA (Gemini, structured output): {ocena, tytuł, cytat, wyjaśnienie, źródła[id], pewność, scenariusz_kwoty?}.
8. WERYFIKACJA: (a) kod: cytat występuje dosłownie w dokumencie; każde id źródła istnieje, jest aktualne i obowiązuje na datę umowy; (b) Gemini-weryfikator: czy źródło popiera tezę. Niepowodzenie → uwaga odrzucona albo przeniesiona do „do weryfikacji” (niewidoczna w darmowym wyniku).
9. KWOTY: liczy kod na podstawie wartości z umowy i scenariusza; zawsze z założeniami.
10. BENCHMARK: tylko przy wystarczającej próbie danych; inaczej brak etykiety.
11. WERDYKT: reguły deterministyczne na podstawie liczby i wagi uwag czerwonych, nie swobodna decyzja modelu.
12. GENEROWANIE: poprawki i mail (skill poprawki-i-mail).
# Zasady
- Limity liczbowe i terminy ustawowe sprawdza kod na podstawie wartości wyciągniętych z umowy i przepisów z legal-kb.
- Każdy etap ma bezpieczną degradację: lepiej mniej uwag niż uwaga błędna.
- Czas do werdyktu docelowo poniżej 60 s; pełny raport może dociągać się w tle.
