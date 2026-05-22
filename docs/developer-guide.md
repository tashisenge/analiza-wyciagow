# Przewodnik deweloperski

---

## Wymagania

- Node.js **22+**
- PostgreSQL 15+ (lokalnie: `npm run db:up` → Docker Compose)
- Opcjonalnie: klucze `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, `TAVILY_API_KEY`

---

## Setup lokalny

```bash
git clone <repo>
cd analiza_wyciagow
cp .env.example .env
# Uzupełnij AUTH_SECRET: openssl rand -base64 32

npm install
npm run db:up
npx prisma migrate dev
npm run demo:seed    # opcjonalnie
npm run dev          # http://localhost:3000
```

Domyślnie dev używa **Webpack** (`npm run dev`). Turbopack: `npm run dev:turbo` — przy błędach CSS usuń `.next` i uruchom ponownie.

---

## Struktura repozytorium

```
src/
  app/                    # Routing Next.js
    (app)/                # Chronione strony (layout + auth)
    (auth)/               # login, register
    api/                  # export CSV, NextAuth
  components/             # UI (dashboard, optimization, transactions…)
  lib/                    # Logika bez React
    analytics/
    ai/
    categorization/
    import/
    mbank/
    optimization/
    transactions/
  server/actions/         # Server Actions ("use server")
prisma/
  schema.prisma
  migrations/
tests/
  lib/                    # Unit (Vitest)
  integration/            # Z DATABASE_URL
  e2e/                    # Playwright
docs/                     # Dokumentacja (ten katalog)
```

---

## Konwencje kodu

Zob. `.cursor/rules/code-readability.mdc`:

- Nazwy w kodzie po **angielsku**; komunikaty UI i błędów po **polsku**.
- Funkcja = jedna odpowiedzialność, max **25 linii** ciała, max **3 parametry** (inaczej obiekt opcji).
- Plik max **200 linii** (wyjątek: `schema.prisma`).
- Logika biznesowa tylko w `src/lib/` lub `src/server/actions/` — nie w komponentach.
- Walidacja granic przez **Zod** (FormData, parametry actions).
- Bez `any`, bez barrel exports w `src/lib/`.

---

## Komendy

| Komenda                 | Opis                                 |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Serwer deweloperski                  |
| `npm run build`         | Build produkcyjny                    |
| `npm run test`          | Vitest (unit + integration)          |
| `npm run test:watch`    | Watch mode                           |
| `npm run test:coverage` | Z progami (lib ≥95%)                 |
| `npm run test:e2e`      | Playwright                           |
| `npm run test:smoke`    | Szybki smoke E2E                     |
| `npm run check`         | format + lint + typecheck + coverage |
| `npm run db:migrate`    | `prisma migrate dev`                 |
| `npm run demo:seed`     | Dane demonstracyjne                  |

---

## Prisma

```bash
npx prisma migrate dev --name opis_zmiany
npx prisma studio          # podgląd DB
npx prisma generate        # po zmianie schema
```

Nowe modele optymalizacji: `OptimizationOpportunity`, `CategoryBudget`, `OpportunityResearch` — patrz [data-model.md](data-model.md).

---

## Dodawanie Server Action

1. Plik w `src/server/actions/<domena>.ts`, dyrektywa `"use server"`.
2. Na początku: `const workspaceId = await getWorkspaceId()` z sesji.
3. Zod na wejściu; błędy po polsku.
4. `revalidatePath` dla dotkniętych stron.
5. Test integracyjny w `tests/integration/` jeśli dotyka DB.

Wzorzec: `src/server/actions/optimization.ts`, `ai.ts`.

---

## Dodawanie detektora optymalizacji

1. Nowy plik `src/lib/optimization/detect-*.ts`.
2. Zwracaj `DetectedOpportunity[]` (typ w `types.ts`).
3. Podłącz w `build-opportunities.ts`.
4. Test w `tests/lib/optimization/`.
5. Zaktualizuj [optimization.md](optimization.md) i spec.

---

## Testy

| Warstwa    | Katalog              | Próg                       |
| ---------- | -------------------- | -------------------------- |
| Unit       | `tests/lib/`         | `src/lib/**` ≥ 95% lines   |
| Integracja | `tests/integration/` | wymaga `DATABASE_URL`      |
| E2E        | `tests/e2e/`         | smoke ścieżek zalogowanych |

Fixture CSV: `tests/fixtures/mbank-sample.csv`.

Strategia: [testing-strategy.md](testing-strategy.md).

---

## Husky / pre-commit

`lint-staged` uruchamia ESLint + Prettier na staged TS; dla `src/lib/**` i `tests/**` — `vitest related --run`.

---

## Debugowanie

- Logi serwera: JSON na stderr (`src/lib/logger.ts`), pola `msg` np. `import.csv`, `ai.insights`.
- Błędy 500 w dev: często uszkodzony `.next` → `rm -rf .next && npm run dev`.
- Import: sprawdź `dedupeHash` w `src/lib/transaction-hash.ts`.

---

## Dokumentacja powiązana

- [Architektura](architecture.md)
- [Model danych](data-model.md)
- [Deploy](deploy-vercel-neon.md)
- Indeks: [README.md](README.md)
