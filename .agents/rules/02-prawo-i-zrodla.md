# Reguły wiedzy prawnej

## Hierarchia źródeł
1. Tekst jednolity ustawy z ISAP (isap.sejm.gov.pl) / API Sejmu ELI (api.sejm.gov.pl). Zapisuj: tytuł aktu, adres publikacyjny (Dz.U. rok poz.), datę stanu prawnego.
2. Prawo UE: EUR-Lex (m.in. dyrektywa 93/13/EWG), orzeczenia TSUE z CURIA.
3. Rejestr klauzul niedozwolonych UOKiK (wpisy z sygnaturą).
4. Orzecznictwo: SN (sn.pl), sądy powszechne (orzeczenia.ms.gov.pl), SAOS.
5. Stanowiska UOKiK, Rzecznika Finansowego, KNF — wskazówki interpretacyjne.
6. Literatura i komentarze — tylko gdy licencja pozwala.

## Akty bazowe (agent pobiera aktualny tekst, nie pisze z pamięci)
- Kodeks cywilny, w szczególności art. 385¹–385³ i 385⁵ oraz przepisy o najmie.
- Ustawa o ochronie praw lokatorów, mieszkaniowym zasobie gminy i o zmianie Kodeksu cywilnego.
- Ustawa o prawach konsumenta.
- Ustawa o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym.
- Ustawa o kredycie konsumenckim; ustawa o kredycie hipotecznym.
- Ustawa o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych.
- Ustawa o prawie autorskim i prawach pokrewnych.
- Kodeks pracy (odróżnianie umów cywilnoprawnych od stosunku pracy).
Przed użyciem aktu sprawdź w ISAP, czy tekst jest aktualny.

## Zasady
- Silnik cytuje WYŁĄCZNIE fragmenty z legal-kb/. Model nie może dodać przepisu spoza pobranego kontekstu (walidacja w kodzie).
- Każdy wpis w legal-kb/ ma: id, URL źródła, datę pobrania, datę stanu prawnego, hash, status (aktualny / uchylony / zmieniony).
- Zmiany prawa wykrywa /aktualizacja-prawa; uwagi oparte na zmienionym przepisie są wyłączane do przeglądu.
- Rozróżniaj: konsument, przedsiębiorca na prawach konsumenta (art. 385⁵ k.c.), przedsiębiorca.
- Checklisty, wzory poprawek i benchmarki zatwierdza prawnik przed publikacją.
