---
name: baza-wiedzy-prawnej
description: Budowa, zasilanie i aktualizacja bazy legal-kb — pobieranie aktów z ISAP/API Sejmu, rejestru klauzul UOKiK, orzecznictwa, podział na jednostki redakcyjne, indeksowanie, wersjonowanie. Używaj przy każdej pracy z treściami prawnymi.
---
# Źródła
- Akty: API Sejmu (ELI) lub ISAP — tekst jednolity, metadane, data stanu prawnego. Najpierw sprawdź aktualną dokumentację API; nie zakładaj formatu z pamięci.
- Rejestr klauzul niedozwolonych UOKiK: sygnatura, treść, podstawa. Sprawdź w źródłach aktualny status prawny rejestru i opisz go w dokumentacji bazy.
- Orzecznictwo: SN, sądy powszechne, SAOS, TSUE (CURIA).
- Respektuj regulaminy, licencje i limity zapytań.
# Jednostka
{id, typ: przepis|klauzula_uokik|orzeczenie|stanowisko, akt/sygnatura, jednostka, treść, url, data_pobrania, stan_prawny_na, hash, status, tagi_typów_umów[], embedding}
# Zasady
- Dziel akty po jednostkach redakcyjnych.
- Orzeczenia: teza + kluczowy fragment uzasadnienia + sygnatura + data + sąd.
- Każda zmiana → nowa wersja; stare zachowane.
- Zmiana przepisu powiązanego z checklistą → zgłoszenie do przeglądu.
- Nic nie trafia do bazy bez URL źródła.
