---
name: interfejs-upload-i-raport
description: Interfejs — strona główna, upload (zdjęcia wielostronicowe, PDF, DOCX), pytania kontekstowe, postęp, raport z podświetleniami, paywall, eksporty. Używaj przy każdej pracy nad frontendem.
---
- Strona główna: jedno zdanie wartości, jeden przycisk „Sprawdź umowę”, pasek zaufania (UE, usuwanie plików, brak trenowania, przykładowy raport).
- Upload: drag & drop, aparat wielostronicowy z podglądem i zmianą kolejności stron.
- Postęp etapami („Czytam dokument”, „Rozpoznaję typ umowy”, „Sprawdzam punkty kontrolne”), aria-live.
- Raport desktop: dwie kolumny z synchronizacją przewijania. Mobile: lista uwag z rozwijanym cytatem i „pokaż w umowie”.
- Paywall po werdykcie i 3 ryzykach; jasna cena; BLIK w ≤2 krokach.
- Komponenty Radix/shadcn, widoczny focus, pełna obsługa klawiatury.
- Testy: Playwright + axe na każdym ekranie, Lighthouse mobile.
