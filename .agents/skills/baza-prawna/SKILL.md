---
name: baza-prawna
description: Budowa i codzienna aktualizacja legal-kb — akty z API Sejmu ELI/ISAP, prawo UE, rejestr klauzul UOKiK, orzecznictwo; podział na jednostki redakcyjne, embeddingi Gemini, wersjonowanie, wykrywanie zmian. Używaj przy każdej pracy z treściami prawnymi.
---
# Jednostka bazy
{id, typ: przepis|klauzula_uokik|decyzja|orzeczenie|stanowisko, akt/sygnatura, jednostka (art./§/ust./pkt), treść, url, data_pobrania, obowiązuje_od, obowiązuje_do, hash, status, tagi_typów_umów[], embedding}
# Zasady
- Dziel akty po jednostkach redakcyjnych; zachowaj hierarchię (tytuł, dział, rozdział).
- Wersjonuj w czasie: zapytanie „jak brzmiał przepis na dzień X” musi mieć odpowiedź.
- Orzeczenia: sygnatura, sąd, data, teza, kluczowy fragment, link.
- Rejestr UOKiK: sprawdź w źródłach aktualny status prawny rejestru i znaczenie wpisów; opisz w docs/legal-kb.md.
- Nic bez URL źródła. Brak dostępu do źródła → zgłoś, nie uzupełniaj z pamięci.
- Zadanie codzienne: wykryj zmiany, zaktualizuj wersje, oznacz zależne checklisty.
