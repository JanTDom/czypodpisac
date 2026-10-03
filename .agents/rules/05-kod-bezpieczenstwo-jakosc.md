# Kod, bezpieczeństwo, jakość

## Stos (zmiana tylko z ADR w docs/adr/)
- Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui (Radix).
- Supabase w regionie UE: Postgres, Auth (link e-mail), Storage, pgvector, Row Level Security na każdej tabeli z danymi użytkownika.
- Hosting: Vercel z funkcjami w regionie UE; długie analizy jako zadania w tle z kolejką i wznawianiem.
- Gemini przez Vertex AI (reguła 03). Walidacja: Zod.
- Płatności: Stripe z BLIK i Przelewy24.
- Eksport DOCX ze śledzeniem zmian (w:ins/w:del) i PDF.

## Bezpieczeństwo i RODO
- OWASP ASVS poziom 2, OWASP Top 10 dla aplikacji webowych i dla aplikacji LLM.
- Szyfrowanie w spoczynku i transmisji; pliki usuwane automatycznie (domyślnie 7 dni) i na żądanie.
- Anonimizacja danych osobowych przed jakimkolwiek zapisem do benchmarku; benchmark tylko za osobną zgodą.
- Projekty: polityka prywatności, regulamin, rejestr czynności przetwarzania, DPIA — do zatwierdzenia przez prawnika.
- Rate limiting, limity plików i stron, ochrona przed nadużyciem darmowego poziomu, CSP i nagłówki bezpieczeństwa.

## Jakość (eliminacja błędów)
- TypeScript strict, ESLint, Prettier, zero ostrzeżeń.
- Testy: Vitest (jednostkowe, w tym walidatory), Playwright (E2E na desktop i mobile), axe-core, Lighthouse CI, testy kontraktowe schematów Gemini.
- Ewaluacja prawna przed każdym wydaniem (skill ewaluacja-jakosci-prawnej).
- Każdy błąd znaleziony w produkcji → test regresyjny przed poprawką.
- Monitoring błędów i wydajności bez danych osobowych.
