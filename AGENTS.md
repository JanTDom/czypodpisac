# Umowa.check — weryfikator umów dla konsumentów i małych firm w Polsce

## Misja
Użytkownik wrzuca umowę (PDF, DOCX, zdjęcie). W ciągu 60 sekund dostaje:
1. Werdykt w jednym zdaniu („Można podpisać po zmianie §7 i §12”).
2. Raport świetlny: czerwone, żółte i zielone punkty z odnośnikiem do paragrafu.
3. Kwotowe oszacowanie ryzyka tam, gdzie da się je policzyć.
4. Listę braków: czego w umowie nie ma, a powinno być.
5. Gotowe poprawki klauzul i mail do drugiej strony.
6. Przycisk eskalacji do radcy prawnego/adwokata przy wyniku czerwonym.

## Przewaga nad ChatGPT (nie wolno jej rozmyć)
- Zero promptowania: system sam rozpoznaje typ umowy i zadaje maks. 3 pytania.
- Stała checklista dla każdego typu umowy, sprawdzana w całości za każdym razem.
- Każda uwaga ma źródło: przepis (z ISAP/ELI), wpis z rejestru klauzul niedozwolonych UOKiK albo orzeczenie. Bez źródła uwaga nie trafia do raportu.
- Benchmark rynkowy: czy zapis jest typowy, odbiega od normy, czy jest skrajny.
- Wynik do działania (poprawki, mail, eksport), nie esej.
- Prywatność: przetwarzanie w UE, brak trenowania na dokumentach, automatyczne usuwanie.

## Zasady nadrzędne
1. ZAKAZ ZMYŚLANIA. Nie wolno wymyślać przepisów, numerów artykułów, sygnatur wyroków, wpisów rejestru UOKiK ani danych rynkowych. Gdy brak źródła: oznacz „wymaga weryfikacji” i nie publikuj jako faktu. Dotyczy kodu agenta i treści dla użytkownika.
2. Każda wiedza prawna pochodzi z legal-kb/ (zasilanej z oficjalnych źródeł), nie z pamięci modelu.
3. Produkt dostarcza analizę i projekt pisma, nie występuje jako „robot prawnik”.
4. Język: polski, prosty (ISO 24495-1), zdania krótkie, żargon zawsze objaśniony.
5. Dostępność WCAG 2.2 AA jest wymogiem wejściowym.

## Kolejność prac
1. MVP: najem lokalu mieszkalnego (zwykły i okazjonalny).
2. Potem: umowa deweloperska; umowa B2B/zlecenie/o dzieło dla freelancera.
3. Dalej: kredyt konsumencki, leasing, OWU ubezpieczeń, umowy z operatorami.
Nowy typ umowy dodawaj wyłącznie workflowem /nowy-typ-umowy.

## Definicja „gotowe”
Funkcja jest gotowa, gdy przechodzi testy i ewaluację prawną, spełnia WCAG 2.2 AA, działa na telefonie 360 px, a każdy tekst dla użytkownika przeszedł przez reguły 04-ux-dostepnosc-jezyk.
