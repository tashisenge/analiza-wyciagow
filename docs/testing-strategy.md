# Strategia testów — analiza_wyciagow

## Cel

Maksymalne pokrycie logiki biznesowej testami uruchamianymi **często** (watch podczas pracy, changed przed commitem, pełny suite w CI). UI jest cienką warstwą nad przetestowaną domeną.

## Narzędzia

| Narzędzie                  | Rola                                                      |
| -------------------------- | --------------------------------------------------------- |
| **Vitest**                 | Unit + integration, coverage v8                           |
| **@testing-library/react** | Komponenty z logiką (formularz importu, zmiana kategorii) |
| **Playwright**             | E2E: rejestracja, import fixture, dashboard               |
| **Husky + lint-staged**    | `test:changed` + `eslint` przed każdym commitem           |

## Format mBank (fixture)

Eksport „Lista operacji” z mBanku (nie stary format wyciągu MT940):

- Preamble: nagłówki banku, klient, okres
- Linia nagłówków: `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;`
- Kwota: `-13,38 PLN` lub `1 900,00 PLN`
- Kategoria banku w osobnej kolumnie (hint do mapowania)

Fixture: `tests/fixtures/mbank-sample.csv`  
Prawdziwe pliki `lista_operacji*.csv` są w `.gitignore`.

## Progi coverage (CI fail)

```text
src/lib/**              → 95% lines, 90% branches
src/server/actions/**   → 85% lines
global                  → 80% lines (podnoszone co sprint)
```

## Workflow deweloperski

1. `npm run test:watch` — cały czas przy pracy nad `src/lib/`
2. Po zmianie: `npm run test:changed` (< 30 s)
3. Przed commit: `npm run check` (= lint + typecheck + test + coverage)
4. Przed merge: `npm run test:e2e`

## Co musi być przetestowane (MVP)

### Unit (`src/lib/`)

- [x] `mbank-csv.ts` — parser „Lista operacji”, kwoty PLN, preamble
- [x] `extract-merchant.ts` — kontrahent z opisu operacji
- [x] `mbank-category-map.ts` / `resolve-category` — kategorie mBank 1:1
- [x] `transaction-hash.ts` — deduplikacja
- [x] `categorization/*` — reguły, pamięć merchant
- [x] `analytics/*` — breakdown, top merchants, date-range, period-summary, category-transactions
- [x] `delete-scoped.ts`, `scoped-update.ts` — filtry workspace przy mutacjach

### Integration

- [x] Import CSV → N transakcji, duplikaty pominięte (`tests/integration/import-flow.test.ts`, wymaga `DATABASE_URL`)
- [ ] Zmiana kategorii → upsert merchant memory (pokryte częściowo przez actions; brak dedykowanego testu)
- [ ] Zapytania dashboard z filtrem kontekstu (pokryte E2E smoke)

### E2E (Playwright)

- [x] **Smoke (`npm run test:smoke`)** — publiczne i chronione trasy bez 500; logowanie demo; dashboard z okresami
- [x] **Import smoke** — `tests/e2e/import-smoke.spec.ts` (fixture CSV, bez 500)
- [ ] Rejestracja + utworzenie workspace (pełny flow)
- [ ] Dashboard — asercja widoczności wykresu Recharts (opcjonalnie)

Przed smoke: Postgres + `npm run demo:seed` (konto `demo@analiza.local` / `demo12345`). W CI: port **3100**, job `e2e` w `.github/workflows/ci.yml`.

## CI (GitHub Actions)

Każdy push/PR: `npm run check` + job `e2e` z `npm run test:smoke` (postgres service container).

## Reguły czytelności

Zobacz `.cursor/rules/code-readability.mdc` oraz `eslint.config.mjs` (complexity, max-lines, strict TypeScript).
