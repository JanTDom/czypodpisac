# czypodpisac.pl

## Obietnica dla użytkownika
„Wrzuć umowę. W minutę wiesz, czy podpisać, co zmienić i jak o to poprosić.”

## Co użytkownik dostaje
1. Werdykt w jednym zdaniu: PODPISZ / PODPISZ PO ZMIANACH / NIE PODPISUJ BEZ PRAWNIKA.
2. Najważniejsze ryzyka po ludzku, z cytatem z umowy i kwotą, ile mogą kosztować.
3. Braki: czego w umowie nie ma, a powinno być.
4. Gotowe nowe brzmienie złych zapisów.
5. Gotowy mail do drugiej strony (wersja uprzejma i stanowcza).
6. Eksport: DOCX ze śledzeniem zmian, PDF raportu.
7. Przy wyniku czerwonym: konsultacja z prawnikiem jednym kliknięciem.

## Zasady nadrzędne (nie podlegają negocjacji)
1. ZAKAZ ZMYŚLANIA. Żadnych wymyślonych przepisów, numerów artykułów, sygnatur, wpisów UOKiK, danych rynkowych ani kwot. Brak źródła = brak twierdzenia albo jawne oznaczenie „do weryfikacji”.
2. Prawo tylko z oficjalnych źródeł zapisanych w legal-kb/, z datą stanu prawnego. Model AI nigdy nie jest źródłem prawa.
3. Każda uwaga w raporcie przechodzi niezależną weryfikację (osobne wywołanie modelu + walidatory w kodzie).
4. Prostota ponad wszystko: jeden ekran startowy, jeden przycisk, zero rejestracji do darmowego wyniku.
5. Prosty polski (ISO 24495-1), WCAG 2.2 AA, działanie na telefonie 360 px.
6. Prywatność: przetwarzanie w UE, brak trenowania na dokumentach, automatyczne usuwanie.
7. Produkt dostarcza analizę i projekt zmian; nie podaje się za prawnika.

## Definicja „gotowe”
Kod przechodzi testy, ewaluację prawną (progi w skillu ewaluacja), audyt dostępności, wydajności i bezpieczeństwa (/audyt-przed-wydaniem), a każdy tekst dla użytkownika spełnia regułę 04.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
