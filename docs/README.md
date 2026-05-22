# Dokumentacja — Analiza wyciągów

Centralny indeks dokumentacji projektu. Aplikacja pomaga parze z JDG zrozumieć wydatki (konto firmowe + domowe) na podstawie eksportów mBank CSV i świadomie optymalizować budżet.

---

## Dla użytkowników

| Dokument                                 | Opis                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| [Przewodnik użytkownika](user-guide.md)  | Pierwsze kroki, import, dashboard, kategorie, optymalizacja |
| [Optymalizacja budżetu](optimization.md) | Możliwości oszczędności, limity, alternatywy z internetu    |
| [Import mBank](import-mbank.md)          | Eksport CSV, format, duplikaty, typowe problemy             |

---

## Dla deweloperów

| Dokument                                      | Opis                                      |
| --------------------------------------------- | ----------------------------------------- |
| [Przewodnik deweloperski](developer-guide.md) | Setup, struktura repo, konwencje, komendy |
| [Architektura](architecture.md)               | Warstwy, przepływy danych, auth, AI       |
| [Model danych](data-model.md)                 | Encje Prisma, relacje, indeksy            |
| [Strategia testów](testing-strategy.md)       | Vitest, Playwright, progi coverage        |
| [Deploy Vercel + Neon](deploy-vercel-neon.md) | Produkcja, env, migracje                  |

---

## Specyfikacje i plany (superpowers)

Dokumenty produktowe i plany implementacji — źródło prawdy przy większych zmianach.

| Dokument                                                                         | Typ                                |
| -------------------------------------------------------------------------------- | ---------------------------------- |
| [Spec główny](superpowers/specs/2026-05-21-analiza-wyciagow-design.md)           | Wizja MVP, konkurencja, roadmapa   |
| [Roadmap v1.1](superpowers/specs/2026-05-22-feature-roadmap-v11.md)              | Priorytety po MVP                  |
| [Spec optymalizacji](superpowers/specs/2026-05-22-budget-optimization.md)        | Wykrywanie możliwości, budżety     |
| [Spec research alternatyw](superpowers/specs/2026-05-22-savings-web-research.md) | Tavily + AI na kartach subskrypcji |
| [Plan MVP](superpowers/plans/2026-05-21-mvp-analiza-wyciagow.md)                 | Implementacja MVP                  |
| [Plan optymalizacji](superpowers/plans/2026-05-22-budget-optimization.md)        | Taski implementacji optymalizacji  |

---

## Szybki start (dev)

```bash
cp .env.example .env
npm run db:up          # Docker Postgres
npm install
npx prisma migrate dev
npm run demo:seed      # opcjonalnie: dane demo
npm run dev
```

Logowanie: konto z seeda lub rejestracja na `/register`.

---

## Mapa aplikacji

| Ścieżka           | Funkcja                                    |
| ----------------- | ------------------------------------------ |
| `/dashboard`      | KPI, wykresy, AI, widget optymalizacji     |
| `/transactions`   | Lista, filtry, edycja kategorii            |
| `/import`         | Upload CSV mBank                           |
| `/categories`     | Kategorie i reguły tekstowe                |
| `/optimize`       | Możliwości oszczędności, budżety, wdrożone |
| `/settings`       | Konta bankowe, workspace                   |
| `/api/export/csv` | Eksport transakcji                         |

---

## Zmienne środowiskowe

Szczegóły: [.env.example](../.env.example) i [deploy-vercel-neon.md](deploy-vercel-neon.md).

| Zmienna                                | Wymagana | Opis                                          |
| -------------------------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`                         | tak      | PostgreSQL (pooled w prod)                    |
| `DIRECT_URL`                           | tak      | Połączenie direct (migracje)                  |
| `AUTH_SECRET`                          | tak      | Sesja NextAuth                                |
| `NEXTAUTH_URL`                         | tak      | URL aplikacji                                 |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | nie      | Kategoryzacja AI, analiza, synteza alternatyw |
| `TAVILY_API_KEY`                       | nie      | Wyszukiwanie alternatyw na `/optimize`        |
