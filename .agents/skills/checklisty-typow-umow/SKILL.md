---
name: checklisty-typow-umow
description: Tworzenie i utrzymanie checklist kontrolnych dla typów umów — punkty kontroli, braki, parametry benchmarku, powiązania z przepisami. Używaj przy dodawaniu lub zmianie typu umowy.
---
# Format punktu
{id, typ_umowy, obszar, pytanie_kontrolne, co_jest_czerwone, co_jest_żółte, co_jest_zielone, czy_brak_jest_ryzykiem, parametr_benchmarku?, przepisy[id_kb], wpisy_uokik[], orzeczenia[], wzór_poprawki_id, status_przeglądu_prawnika}
# Proces
1. Szkic na podstawie aktów z legal-kb/, z odnośnikami do jednostek.
2. Każde twierdzenie o limicie, terminie lub obowiązku ma id przepisu. Brak id = status „szkic”, niewidoczny dla użytkowników.
3. Status „aktywny” dopiero po zatwierdzeniu przez prawnika.
# Obszary startowe — najem lokalu mieszkalnego (wartości pobierz z aktualnych aktów)
- Strony, przedmiot, stan lokalu, protokół zdawczo-odbiorczy, wyposażenie.
- Czynsz, opłaty i media, tryb podwyżek, waloryzacja.
- Kaucja: wysokość względem ustawowego limitu, zwrot, terminy, potrącenia.
- Czas trwania, wypowiedzenie: przyczyny, terminy, zgodność z ustawą o ochronie praw lokatorów.
- Najem okazjonalny/instytucjonalny: wymagane załączniki i formy, zgłoszenie do urzędu skarbowego.
- Kary umowne i opłaty dodatkowe; naprawy i nakłady; podnajem; zwierzęta; wizyty właściciela.
- Klauzule potencjalnie abuzywne wobec konsumenta.
