# Kod, architektura, jakość

## Stos (zmiana tylko z uzasadnieniem w ADR)
- Next.js (App Router) + TypeScript strict, Tailwind CSS, shadcn/ui (Radix).
- Supabase w regionie UE: Postgres, Auth, Storage, pgvector, RLS.
- Vercel z funkcjami w regionie UE.
- Model językowy przez API z regionem UE i brakiem trenowania; warstwa abstrakcji pozwalająca zmienić dostawcę.
- OCR i ekstrakcja struktury: usługa z przetwarzaniem w UE; fallback lokalny.
- Płatności: Stripe z BLIK i Przelewy24.
- Walidacja: Zod. Wyjście modelu ZAWSZE jako JSON zgodny ze schematem.

## Zasady
- Pipeline analizy jako niezależne, testowalne etapy. Żadnego „jednego wielkiego promptu”.
- Decyzje architektoniczne w docs/adr/.
- Testy: Vitest, Playwright, axe-core, ewaluacja prawna.
- Sekrety tylko w zmiennych środowiskowych.
- Logi techniczne bez treści umów; metryka kosztu na dokument.
