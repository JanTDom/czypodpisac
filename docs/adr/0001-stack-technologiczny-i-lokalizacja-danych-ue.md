# ADR 0001: Wybór stosu technologicznego i lokalizacja danych w UE

## Status
Przyjęty

## Data
2026-10-03

## Kontekst
Umowa.check przetwarza wysoce poufne dokumenty prawne obywateli i firm z Polski (umowy najmu, kredytowe, deweloperskie). Zgodnie z RODO, projektowanymi wymogami AI Act oraz zasadami projektu (`03-bezpieczenstwo-rodo-aiact.md`), dane osobowe, pliki umów, logi i inferencja modeli AI muszą odbywać się bezwzględnie w granicach Unii Europejskiej, z gwarancją braku trenowania modeli na danych użytkowników. Dodatkowo interfejs musi spełniać standard WCAG 2.2 AA i działać bez opóźnień na urządzeniach mobilnych (smartfony od 360 px szerokości).

## Decyzja
1. **Frontend i API:** Next.js (App Router) z TypeScript w trybie strict. Framework wspiera Server Components, optymalizację SEO pod kątem stron poszczególnych umów, strumieniowanie UI oraz natywne API routes w regionie UE (`fra1` - Frankfurt).
2. **Styling i komponenty:** Tailwind CSS oraz shadcn/ui oparte na Radix UI Primitives, gwarantujące pełną dostępność klawiatury, zarządzanie fokusem i atrybuty ARIA zgodne z WCAG 2.2 AA.
3. **Baza danych i storage:** Supabase w regionie UE (Frankfurt):
   - PostgreSQL 16 z Row Level Security (RLS) dla ścisłej izolacji danych najemców/sesji,
   - Rozszerzenie `pgvector` do wyszukiwania semantycznego w bazie prawnej,
   - Supabase Storage z szyfrowaniem w spoczynku i regułami path-based RLS.
4. **Warstwa LLM:** Dostęp przez ustandaryzowaną warstwę abstrakcji do dostawców oferujących przetwarzanie wyłącznie w UE, podpisanie umowy powierzenia przetwarzania danych (DPA) oraz politykę zerowej retencji do celów treningowych.
5. **Płatności:** Stripe z obsługą dedykowanych metod płatności w Polsce (BLIK, Przelewy24, karty płatnicze) oraz idempotentnymi webhookami.

## Konsekwencje
- **Pozytywne:**
  - Pełna zgodność z RODO i wymogami prawa europejskiego.
  - Szybki czas odpowiedzi (serwery i bazy zlokalizowane we Frankfurcie blisko użytkowników w Polsce).
  - Wysokie bezpieczeństwo dzięki separacji danych na poziomie bazy (RLS).
  - Łatwa wymiana dostawcy modeli dzięki warstwie abstrakcji.
- **Negatywne/Wyzwania:**
  - Konieczność rygorystycznego konfigurowania regionu dla każdej usługi chmurowej (zakaz domyślnego routingu do US).
  - Wymóg audytu dostawców modeli pod kątem faktycznej lokalizacji obliczeń.
