# ADR 0005: Architektura generowania raportów PDF i eksportu DOCX ze śledzeniem zmian

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Płatny pakiet Umowa.check oferuje użytkownikowi:
1. Pobranie podsumowania raportu w formacie PDF.
2. Pobranie poprawionej wersji umowy w formacie DOCX z rzeczywistym śledzeniem zmian (`track changes`) oraz komentarzami redakcyjnymi.

W środowiskach serverless (Vercel) uruchamianie pełnych silników przeglądarkowych (Puppeteer, headless Chromium) prowadzi do przekroczenia limitu rozmiaru funkcji (50 MB), długich cold startów (>10 s) oraz wycieków pamięci. Z kolei eksport DOCX wymaga rygorystycznej zgodności ze standardem OpenXML (elementy `w:ins`, `w:del`, `w:comment`), aby Word i LibreOffice natywnie wyświetlały historię poprawek.

## Decyzja
1. **Generowanie PDF:**
   - Podstawowy mechanizm klienta: Dedykowany arkusz stylów `@media print` w React/Tailwind oraz wywołanie natywnego `window.print()` (zoptymalizowany układ A4, ukrycie elementów nawigacji, zachowanie kolorów ryzyka i podziałów stron).
   - Opcja serwerowa: Lekki, deterministyczny kompilator wektorowy (np. PDFKit lub Typst), bez instalacji ciężkich przeglądarek w Vercel Serverless.
2. **Generowanie DOCX:**
   - Wykorzystanie biblioteki generującej dokumenty Word w oparciu o czysty standard XML (`docx` w Node.js).
   - Wszystkie proponowane poprawki do umowy są generowane w formie natywnych znaczników rewizyjnych OpenXML:
     - Usunięty tekst: `<w:del><w:r><w:delText>...</w:delText></w:r></w:del>`,
     - Dodany tekst: `<w:ins><w:r><w:t>...</w:t></w:r></w:ins>`,
     - Komentarze prawne powiązane z klauzulami: `<w:commentRangeStart>`, `<w:commentReference>`.
   - Pozwala to drugiej stronie umowy na natywne zaakceptowanie lub odrzucenie poprawek w programie Microsoft Word.

## Konsekwencje
- **Pozytywne:**
  - Natychmiastowe pobieranie PDF (< 1 s) bez obciążania serwerów i bez ryzyka timeoutów Vercel.
  - Najwyższy profesjonalizm dokumentu DOCX — odbiorca widzi standardowy tryb „Śledź zmiany”, dokładnie jak po redakcji przez kancelarię prawną.
  - Niezależność od zewnętrznych, płatnych konwerterów PDF/Word.
- **Negatywne/Wyzwania:**
  - Konieczność precyzyjnego ostylowania reguł CSS `@media print` (kontrola łamania stron `break-inside: avoid`).
  - Precyzyjna obsługa drzewa OpenXML przy wstawianiu znaczników `w:ins` i `w:del` w akapitach DOCX.
