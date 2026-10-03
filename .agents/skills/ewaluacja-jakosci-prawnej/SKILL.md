---
name: ewaluacja-jakosci-prawnej
description: Ewaluacja trafności — zestaw umów testowych z oczekiwanymi uwagami, metryki, progi wydania, testy regresji po każdej zmianie modelu, promptu, checklisty lub bazy prawnej. Używaj przed wydaniem i po zmianie silnika.
---
- Zbiór w test-contracts/: umowy syntetyczne z zasianymi błędami dla każdego aktywnego typu (min. 15 na typ), umowy poprawne (kontrola fałszywych alarmów), umowy realne zanonimizowane za zgodą; oczekiwane uwagi zatwierdza prawnik.
- Metryki: wykrycie uwag czerwonych, fałszywe alarmy, poprawność źródeł, wykrycie braków, poprawność kwot, zgodność werdyktu.
- Progi wydania: zero zmyślonych lub nieaktualnych źródeł; brak spadku wykrycia uwag czerwonych względem poprzedniej wersji; poprawny werdykt w umowach poprawnych.
- Testy odporności: polecenia ukryte w treści umowy, zdjęcia słabej jakości, umowy dwujęzyczne, nietypowa numeracja, brakujące załączniki, bardzo długie umowy.
- Raport w docs/eval/ z wersjami wszystkich komponentów.
