# MVP Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Domknąć luki MVP względem speca §6.3–§7: wykresy Recharts na dashboardzie, filtry dat/kontekstu, smoke E2E w CI, test integracyjny importu oraz spójne scope `workspaceId` w mutacjach Prisma.

**Architecture:** Większość fundamentu (parser, kategoryzacja mBank 1:1, auth, import, CRUD kategorii/ustawień, AI, logger) jest już zaimplementowana — ten plan uzupełnia warstwę prezentacji (Recharts), UX transakcji, jakość (Playwright + integracja) i bezpieczeństwo (IDOR). Nowa logika dat w `src/lib/analytics/date-range.ts`; komponenty wykresów jako Client Components; E2E uruchamia `next start` na porcie 3100 w CI.

**Tech Stack:** Next.js 15, Prisma 6, PostgreSQL, Recharts 3, Vitest, Playwright, Auth.js v5

**Stan wyjściowy (już zrobione):** Tasks 1–10, 12–13 z planu `2026-05-21-mvp-analiza-wyciagow.md`; smoke Playwright lokalnie; `deleteCategory` scoped — wzorzec w `src/lib/categories/delete-scoped.ts`.

**Spec:** `docs/superpowers/specs/2026-05-21-analiza-wyciagow-design.md`  
**Testy:** `docs/testing-strategy.md`

---

## Mapa plików (ten plan)

| Plik                                           | Odpowiedzialność                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `src/lib/analytics/date-range.ts`              | Zakres dat: miesiąc / kwartał / rok → `from`, `to`, poprzedni okres |
| `src/lib/analytics/period-summary.ts`          | Suma wydatków i wpływów za okres                                    |
| `src/lib/transactions/scoped-update.ts`        | Filtry Prisma z `workspaceId` przy update transakcji                |
| `src/components/dashboard/CategoryChart.tsx`   | Wykres kołowy Recharts (client)                                     |
| `src/components/dashboard/MerchantChart.tsx`   | Wykres słupkowy merchantów (client)                                 |
| `src/components/dashboard/PeriodSummary.tsx`   | Karty: wydatki / wpływy / bilans                                    |
| `src/components/dashboard/DateRangeToggle.tsx` | Przełącznik okresu w URL                                            |
| `src/app/(app)/dashboard/page.tsx`             | Loader z `date-range` + przekazanie props do wykresów               |
| `src/app/(app)/transactions/page.tsx`          | Filtry kontekstu + dat; redirect zamiast throw                      |
| `playwright.config.ts`                         | Port 3100 w CI; `reuseExistingServer`                               |
| `.github/workflows/ci.yml`                     | Job `e2e` z Postgres + `demo:seed`                                  |
| `tests/e2e/import-smoke.spec.ts`               | Import fixture CSV bez 500                                          |
| `tests/integration/import-flow.test.ts`        | Vitest + Prisma: import + dedupe                                    |
| `tests/lib/date-range.test.ts`                 | Unit zakresów dat                                                   |

---

### Task 1: Zakres dat (lib)

**Files:**

- Create: `src/lib/analytics/date-range.ts`
- Test: `tests/lib/date-range.test.ts`

- [ ] **Step 1: Napisz test**

```typescript
import { describe, expect, it } from "vitest";

import { resolveDateRange } from "@/lib/analytics/date-range";

describe("resolveDateRange", () => {
  it("returns current and previous month", () => {
    const now = new Date("2026-05-15T12:00:00Z");
    const range = resolveDateRange("month", now);
    expect(range.currentStart.toISOString().slice(0, 7)).toBe("2026-05");
    expect(range.previousStart.toISOString().slice(0, 7)).toBe("2026-04");
    expect(range.currentEnd.getTime()).toBeGreaterThan(range.currentStart.getTime());
  });

  it("defaults to month for unknown period", () => {
    const range = resolveDateRange("invalid", new Date("2026-05-15"));
    expect(range.label).toContain("2026");
  });
});
```

- [ ] **Step 2: Uruchom test — FAIL**

```bash
npm test -- tests/lib/date-range.test.ts
```

Expected: FAIL — `resolveDateRange` not defined

- [ ] **Step 3: Implementacja**

```typescript
export type PeriodPreset = "month" | "quarter" | "year";

export interface DateRangeResult {
  label: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarter, 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function resolveDateRange(
  preset: string,
  now: Date = new Date(),
): DateRangeResult {
  const period: PeriodPreset =
    preset === "quarter" || preset === "year" ? preset : "month";

  let currentStart: Date;
  if (period === "quarter") {
    currentStart = startOfQuarter(now);
  } else if (period === "year") {
    currentStart = startOfYear(now);
  } else {
    currentStart = startOfMonth(now);
  }

  const currentEnd = now;
  const previousEnd = new Date(currentStart.getTime() - 1);
  let previousStart: Date;
  if (period === "quarter") {
    previousStart = startOfQuarter(previousEnd);
  } else if (period === "year") {
    previousStart = startOfYear(previousEnd);
  } else {
    previousStart = startOfMonth(previousEnd);
  }

  const label = currentStart.toLocaleDateString("pl-PL", {
    month: period === "year" ? undefined : "long",
    year: "numeric",
  });

  return { label, currentStart, currentEnd, previousStart, previousEnd };
}
```

- [ ] **Step 4: PASS**

```bash
npm test -- tests/lib/date-range.test.ts
```

Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/date-range.ts tests/lib/date-range.test.ts
git commit -m "feat: date range presets for dashboard filters"
```

---

### Task 2: Podsumowanie okresu (wydatki / wpływy)

**Files:**

- Create: `src/lib/analytics/period-summary.ts`
- Test: `tests/lib/period-summary.test.ts`

- [ ] **Step 1: Napisz test**

```typescript
import { describe, expect, it } from "vitest";

import { summarizePeriod } from "@/lib/analytics/period-summary";

describe("summarizePeriod", () => {
  it("sums expenses and income", () => {
    const summary = summarizePeriod([
      { amount: "-100.00" },
      { amount: "-50.25" },
      { amount: "3000.00" },
    ]);
    expect(summary.totalExpenses).toBe(150.25);
    expect(summary.totalIncome).toBe(3000);
    expect(summary.net).toBe(2849.75);
  });
});
```

- [ ] **Step 2: FAIL → implement → PASS**

```typescript
export interface PeriodSummary {
  totalExpenses: number;
  totalIncome: number;
  net: number;
}

export function summarizePeriod(transactions: { amount: string }[]): PeriodSummary {
  let totalExpenses = 0;
  let totalIncome = 0;
  for (const tx of transactions) {
    const value = Number(tx.amount);
    if (value < 0) {
      totalExpenses += Math.abs(value);
    } else if (value > 0) {
      totalIncome += value;
    }
  }
  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
  };
}
```

```bash
npm test -- tests/lib/period-summary.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics/period-summary.ts tests/lib/period-summary.test.ts
git commit -m "feat: period income and expense summary"
```

---

### Task 3: Wykresy Recharts na dashboardzie

**Files:**

- Create: `src/components/dashboard/CategoryChart.tsx`
- Create: `src/components/dashboard/MerchantChart.tsx`
- Create: `src/components/dashboard/PeriodSummary.tsx`
- Create: `src/components/dashboard/DateRangeToggle.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: `CategoryChart.tsx` (client)**

```tsx
"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategorySlice } from "@/lib/analytics/category-breakdown";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#64748b",
];

interface CategoryChartProps {
  slices: CategorySlice[];
}

export function CategoryChart({ slices }: CategoryChartProps): React.JSX.Element {
  if (slices.length === 0) {
    return <p className="text-sm text-slate-500">Brak wydatków w tym okresie.</p>;
  }
  const data = slices.map((slice) => ({
    name: slice.categoryName,
    value: slice.total,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value.toFixed(2)} PLN`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: `MerchantChart.tsx` (client)**

```tsx
"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MerchantRow } from "@/lib/analytics/top-merchants";

interface MerchantChartProps {
  merchants: MerchantRow[];
}

export function MerchantChart({ merchants }: MerchantChartProps): React.JSX.Element {
  if (merchants.length === 0) {
    return <p className="text-sm text-slate-500">Brak danych o kontrahentach.</p>;
  }
  const data = merchants.slice(0, 10).map((row) => ({
    name: row.counterparty.slice(0, 24),
    total: row.total,
    change: row.changePercent,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" tickFormatter={(v) => `${String(v)}`} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number, _name, item) => {
            const change = item.payload?.change as number | null;
            const changeLabel =
              change === null
                ? "brak porównania"
                : `${change > 0 ? "+" : ""}${String(change)}%`;
            return [`${value.toFixed(2)} PLN (${changeLabel})`, "Suma"];
          }}
        />
        <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: `PeriodSummary.tsx` + `DateRangeToggle.tsx`**

```tsx
// PeriodSummary.tsx — server component, brak "use client"
import type { PeriodSummary as Summary } from "@/lib/analytics/period-summary";

export function PeriodSummaryCards({ summary }: { summary: Summary }): React.JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-slate-500">Wydatki</p>
        <p className="text-xl font-semibold text-red-700">
          {summary.totalExpenses.toFixed(2)} PLN
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-slate-500">Wpływy</p>
        <p className="text-xl font-semibold text-green-700">
          {summary.totalIncome.toFixed(2)} PLN
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-slate-500">Bilans</p>
        <p className="text-xl font-semibold">{summary.net.toFixed(2)} PLN</p>
      </div>
    </div>
  );
}
```

```tsx
// DateRangeToggle.tsx
import Link from "next/link";

const PERIODS = [
  { key: "month", label: "Miesiąc" },
  { key: "quarter", label: "Kwartał" },
  { key: "year", label: "Rok" },
] as const;

export function DateRangeToggle({
  active,
  context,
}: {
  active: string;
  context: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((period) => (
        <Link
          key={period.key}
          href={`/dashboard?context=${context}&period=${period.key}`}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            active === period.key
              ? "bg-indigo-600 text-white"
              : "bg-white border text-slate-700 hover:bg-slate-50"
          }`}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Zaktualizuj `dashboard/page.tsx`**

Użyj `resolveDateRange(searchParams.period)`, filtruj transakcje po `bookedAt` między `range.currentStart` a `range.currentEnd`, wywołaj `summarizePeriod`, zamień listy na `<CategoryChart>`, `<MerchantChart>`, `<PeriodSummaryCards>`, dodaj `<DateRangeToggle>`. Zachowaj `AiPanel` i `ContextToggle`. SearchParams: `{ context?: string; period?: string }`.

- [ ] **Step 5: Smoke ręczny**

```bash
npm run dev
# Zaloguj demo@analiza.local / demo12345
# /dashboard?context=razem&period=month — wykres kołowy i słupki widoczne
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ src/app/(app)/dashboard/page.tsx
git commit -m "feat: dashboard Recharts charts and period filters"
```

---

### Task 4: Scope `workspaceId` przy update transakcji

**Files:**

- Create: `src/lib/transactions/scoped-update.ts`
- Modify: `src/server/actions/transactions.ts`
- Test: `tests/lib/scoped-update.test.ts`

- [ ] **Step 1: Test**

```typescript
import { describe, expect, it } from "vitest";

import { scopedTransactionUpdate } from "@/lib/transactions/scoped-update";

describe("scopedTransactionUpdate", () => {
  it("includes workspaceId and transaction id", () => {
    expect(scopedTransactionUpdate("ws-1", "tx-1")).toEqual({
      where: { id: "tx-1", workspaceId: "ws-1" },
      data: { categoryId: "cat-9" },
    });
  });
});
```

- [ ] **Step 2: Implementacja + użycie w action**

```typescript
// src/lib/transactions/scoped-update.ts
export function scopedTransactionUpdate(
  workspaceId: string,
  transactionId: string,
  categoryId: string,
): {
  where: { id: string; workspaceId: string };
  data: { categoryId: string };
} {
  return {
    where: { id: transactionId, workspaceId },
    data: { categoryId },
  };
}
```

W `transactions.ts` zamień:

```typescript
await prisma.transaction.update({
  ...scopedTransactionUpdate(workspaceId, transactionId, categoryId),
});
```

Dodatkowo waliduj, że `categoryId` należy do workspace:

```typescript
const category = await prisma.category.findFirst({
  where: { id: categoryId, workspaceId },
});
if (!category) {
  return { ok: false, error: "Nieprawidłowa kategoria" };
}
```

- [ ] **Step 3: PASS + commit**

```bash
npm test -- tests/lib/scoped-update.test.ts
git add src/lib/transactions/scoped-update.ts src/server/actions/transactions.ts tests/lib/scoped-update.test.ts
git commit -m "fix: scope transaction category updates to workspace"
```

---

### Task 5: Filtry na liście transakcji

**Files:**

- Modify: `src/app/(app)/transactions/page.tsx`
- Create: `src/components/transactions/TransactionFilters.tsx`

- [ ] **Step 1: `TransactionFilters.tsx`**

Linki: Wszystkie | Bez kategorii | Firma | Dom — budują URL `?uncategorized=1`, `?context=firma`, itd.

- [ ] **Step 2: Rozszerz query w `transactions/page.tsx`**

```typescript
// searchParams: { uncategorized?: string; context?: string }
import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";

const context = (params.context ?? "razem") as ContextFilter;
const accounts = await prisma.account.findMany({ where: { workspaceId } });
const accountIds = accountIdsForContext(accounts, context);

const transactions = await prisma.transaction.findMany({
  where: {
    workspaceId,
    accountId: { in: accountIds },
    ...(params.uncategorized === "1" ? { categoryId: null } : {}),
  },
  orderBy: { bookedAt: "desc" },
  take: 200,
  include: { category: true, account: true },
});
```

Zamień `throw new Error("Brak sesji")` na `redirect("/login")`. Obsłuż błąd `updateTransactionCategory` — przekieruj z `?error=` jeśli action zwraca `{ ok: false }` (wymaga opakowania `changeCategoryAction` jak w login).

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/transactions/page.tsx src/components/transactions/TransactionFilters.tsx
git commit -m "feat: transaction list context and uncategorized filters"
```

---

### Task 6: Playwright smoke — naprawa CI i test importu

**Files:**

- Modify: `playwright.config.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `tests/e2e/import-smoke.spec.ts`

- [ ] **Step 1: Port 3100 w CI (unikaj EADDRINUSE)**

```typescript
// playwright.config.ts — na górze pliku
const port = process.env["CI"] ? "3100" : "3000";
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? `http://localhost:${port}`;

// webServer:
webServer: {
  command: process.env["CI"]
    ? `npm run build && PORT=${port} npm run start`
    : "npm run build && npm run start",
  url: `${baseURL}/login`,
  reuseExistingServer: !process.env["CI"],
  timeout: 180_000,
},
```

- [ ] **Step 2: Włącz job e2e w CI**

```yaml
# .github/workflows/ci.yml — zamień job e2e:
e2e:
  runs-on: ubuntu-latest
  needs: check
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_USER: analiza
        POSTGRES_PASSWORD: analiza
        POSTGRES_DB: analiza_wyciagow
      ports: ["5432:5432"]
      options: >-
        --health-cmd "pg_isready -U analiza"
        --health-interval 5s
        --health-timeout 5s
        --health-retries 5
  env:
    DATABASE_URL: postgresql://analiza:analiza@localhost:5432/analiza_wyciagow
    AUTH_SECRET: ci-test-secret-min-32-chars-long!!
    NEXTAUTH_URL: http://localhost:3100
    PLAYWRIGHT_BASE_URL: http://localhost:3100
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "22"
        cache: npm
    - run: npm ci
    - run: npx prisma migrate deploy
    - run: npm run demo:seed
    - run: npx playwright install --with-deps chromium
    - run: npm run test:smoke
```

- [ ] **Step 3: Test importu E2E**

```typescript
// tests/e2e/import-smoke.spec.ts
import path from "path";
import { test, expect } from "@playwright/test";

const fixture = path.join(process.cwd(), "tests/fixtures/mbank-sample.csv");

test("import fixture CSV — sukces bez 500", async ({ page }) => {
  await page.goto("/import");
  await page.locator('select[name="accountId"]').selectOption({ index: 0 });
  await page.locator('input[name="file"]').setInputFiles(fixture);
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/import") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Importuj" }).click();
  const response = await responsePromise;
  expect(response.status()).not.toBe(500);
  await expect(page.getByText(/Zaimportowano|pominięto/i)).toBeVisible({
    timeout: 15_000,
  });
});
```

Dodaj projekt w `playwright.config.ts`:

```typescript
{
  name: "smoke-import",
  testMatch: /import-smoke\.spec\.ts/,
  dependencies: ["setup"],
  use: { storageState: "playwright/.auth/demo.json" },
},
```

Zaktualizuj `package.json`:

```json
"test:smoke": "playwright test --project=smoke-public --project=setup --project=smoke-app --project=smoke-import"
```

- [ ] **Step 4: Lokalnie**

```bash
npm run demo:seed   # jeśli pusta baza
npm run test:smoke
```

Expected: wszystkie projekty PASS (w tym POST login złe hasło ≠ 500)

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts .github/workflows/ci.yml tests/e2e/import-smoke.spec.ts package.json
git commit -m "ci: enable Playwright smoke on port 3100 with import test"
```

---

### Task 7: Test integracyjny importu (Vitest)

**Files:**

- Create: `tests/integration/import-flow.test.ts`

Wymaga działającego `DATABASE_URL` (lokalny Postgres). Test pomijany gdy brak DB:

- [ ] **Step 1: Implementacja**

```typescript
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { processCsvImport } from "@/lib/import/process-csv-import";
import { buildCategoriesByName, syncMbankCategories } from "@/lib/mbank/sync-categories";
import { prisma } from "@/lib/db";

const FIXTURE = join(process.cwd(), "tests/fixtures/mbank-sample.csv");
const HAS_DB = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!HAS_DB)("import flow integration", () => {
  it("imports fixture rows without duplicate on second run", async () => {
    const workspace = await prisma.workspace.create({ data: { name: "Test WS" } });
    const account = await prisma.account.create({
      data: { workspaceId: workspace.id, type: "dom", name: "Test" },
    });
    const csv = readFileSync(FIXTURE, "utf-8");
    const rows = parseMbankCsv(csv); // import from mbank-csv
    await syncMbankCategories(
      workspace.id,
      rows.map((r) => r.mbankCategory),
    );
    const categoriesByName = await buildCategoriesByName(workspace.id);

    const first = processCsvImport({
      csvContent: csv,
      rows,
      accountId: account.id,
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName,
    });
    expect(first.toInsert.length).toBeGreaterThan(0);

    const hashes = new Set(first.toInsert.map((r) => r.dedupeHash));
    const second = processCsvImport({
      csvContent: csv,
      rows,
      accountId: account.id,
      existingHashes: hashes,
      rules: [],
      memories: [],
      categoriesByName,
    });
    expect(second.toInsert).toHaveLength(0);
    expect(second.skippedCount).toBe(first.toInsert.length);

    await prisma.workspace.delete({ where: { id: workspace.id } });
  });
});
```

Dodaj import `parseMbankCsv` z `@/lib/mbank-csv`.

- [ ] **Step 2: Uruchom**

```bash
npm test -- tests/integration/import-flow.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/integration/import-flow.test.ts
git commit -m "test: integration import dedupe flow"
```

---

### Task 8: Weryfikacja końcowa MVP

- [ ] **Step 1: Pełny check**

```bash
npm run check
npm run test:smoke
```

Expected: lint + typecheck + coverage PASS; smoke PASS

- [ ] **Step 2: Kryteria speca §11 — checklist ręczny**

| Kryterium                     | Jak zweryfikować                                      |
| ----------------------------- | ----------------------------------------------------- |
| Import 2 mies. bez duplikatów | Import CSV firma + dom; drugi import → skipped        |
| >80% z kategorią              | Dashboard → licznik „bez kategorii”; `npm run ai:map` |
| Odpowiedź w 5 min             | Dashboard wykresy + top merchantów                    |
| Para w 1 workspace            | Rejestracja z kodem zaproszenia w Ustawienia          |

- [ ] **Step 3: Commit dokumentacji**

Zaktualizuj `docs/testing-strategy.md` — zaznacz smoke i integrację jako done.

```bash
git add docs/testing-strategy.md
git commit -m "docs: mark smoke and integration tests complete"
```

---

## Self-Review (plan vs spec)

| Wymaganie speca                          | Task                                      |
| ---------------------------------------- | ----------------------------------------- |
| §6.3 filtry firma/dom/razem + zakres dat | Task 1, 3, 5                              |
| §6.3 wykres A kategorii                  | Task 3                                    |
| §6.3 wykres B merchantów                 | Task 3                                    |
| §6.3 wydatki vs wpływy                   | Task 2, 3                                 |
| §6.3 tabela transakcji + filtry          | Task 5                                    |
| §7 ekrany MVP                            | Już zrobione; Task 3–5 uzupełniają        |
| §8 E2E login, import, dashboard          | Task 6, 7                                 |
| §9 scope workspace / IDOR                | Task 4 (+ wcześniejszy delete-scoped)     |
| §9 RODO eksport/usuń                     | Już zrobione (Task 12 poprzedniego planu) |
| v1.1 insight C                           | Poza planem                               |
| Open Banking v2                          | Poza planem                               |

**Placeholder scan:** brak TBD.

**Luka znana:** `MerchantRow` — sprawdź eksport typu z `top-merchants.ts` (jeśli nazwa inna, dopasuj w Task 3).

---

## Kolejność i szacunek

| Task                        | ~czas  |
| --------------------------- | ------ |
| 1–2 lib analytics           | 1 h    |
| 3 Recharts dashboard        | 2–3 h  |
| 4–5 security + transactions | 1 h    |
| 6–7 CI + tests              | 2 h    |
| 8 weryfikacja               | 30 min |

**Razem:** ~7–8 h

---

## Execution Handoff

Plan zapisany w `docs/superpowers/plans/2026-05-22-mvp-completion.md`. Dwie opcje realizacji:

**1. Subagent-Driven (zalecane)** — osobny subagent na task, review między taskami.

**2. Inline Execution** — realizacja w tej sesji przez `executing-plans`, partiami z checkpointami.

Którą opcję wybierasz?
