---
name: ewaluacja-jakosci-prawnej
description: Ewaluacja trafności analiz — zestaw umów testowych z oceną prawnika, metryki, testy regresji po zmianie modelu, promptu, checklisty lub bazy prawnej. Używaj przed każdym wydaniem i po zmianie silnika.
---
- Zbiór: umowy realne (zanonimizowane, za zgodą) i syntetyczne z zasianymi błędami; oczekiwane uwagi oznaczone przez prawnika.
- Metryki: recall uwag czerwonych (priorytet), precision, poprawność źródeł, wykrycie braków, poprawność kwot.
- Próg wydania: brak spadku recall czerwonych; zero zmyślonych źródeł.
- Odporność: prompt injection w umowie, słabe zdjęcia, umowy dwujęzyczne, nietypowa numeracja, załączniki.
- Raport w docs/eval/ z wersjami komponentów.
