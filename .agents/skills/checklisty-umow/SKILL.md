---
name: checklisty-umow
description: Checklisty kontrolne dla typów umów — najem (zwykły, okazjonalny, instytucjonalny), deweloperska, rezerwacyjna, przedwstępna, sprzedaż, kredyt i pożyczka, leasing, B2B, zlecenie, o dzieło, przeniesienie praw autorskich, pośrednictwo, OWU ubezpieczeń, operatorzy, energia, usługi turystyczne, budowlane, franczyza, spółki. Używaj przy tworzeniu i zmianie checklist.
---
# Format punktu
{id, typ_umowy, obszar, pytanie_kontrolne, kiedy_czerwony, kiedy_żółty, kiedy_zielony, czy_brak_jest_ryzykiem, parametr_benchmarku?, przepisy[id_kb], uokik[], orzeczenia[], wzór_poprawki_id, status: szkic|do_przeglądu|aktywny}
# Proces
1. Szkic tylko na podstawie legal-kb, z id źródeł przy każdym limicie, terminie i obowiązku.
2. Kolejność typów: najem → deweloperska i przedwstępna → B2B/zlecenie/dzieło → kredyt/pożyczka/leasing → pozostałe.
3. Umowy typu „inny”: checklista uniwersalna + przepisy z warstwy B, z oznaczeniem w raporcie.
4. Status „aktywny” po zatwierdzeniu przez prawnika; wcześniej uwagi z punktów „szkic” trafiają tylko do sekcji „do weryfikacji”.
