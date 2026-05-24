# Opcjonalne wydatki („głupoty”) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dać parze (JDG + dom) jawny widok wydatków opcjonalnych — suma, udział %, trend, limit miesięczny i raport top kontrahentów — na bazie kategorii oznaczonych jako „opcjonalne”, bez osobnego konta per osoba.

**Architecture:** Pole `Category.isDiscretionary` (jak `excludeFromOptimization`) + model `DiscretionaryBudget` (jeden limit PLN/mies. na kontekst `firma|dom|razem`). Logika agregacji w `src/lib/discretionary/` (pure functions + loader). UI: strona `/opcjonalne`, widget na dashboardzie, checkbox na `/categories`. Transakcje opcjonalne = wydatek (`amount < 0`), liczony w analityce (`shouldCountInAnalytics`), kategoria z `isDiscretionary: true`.

**Tech Stack:** Next.js 15 App Router, Prisma 6, PostgreSQL, Vitest, istniejące wzorce (`ContextToggle`, `PeriodPicker`, `AmountValue`, server actions).

**Poza zakresem tego planu:** podział wydatków ja/żona (osobne konta), auto-sync banku, push notyfikacje, osobny silnik AI „głupoty”.

---

## File map

| Plik | Odpowiedzialność |
|------|------------------|
| `prisma/schema.prisma` | `Category.isDiscretionary`, model `DiscretionaryBudget` |
| `prisma/migrations/...` | migracja SQL |
| `src/lib/categories/default-categories.ts` | domyślnie `Rozrywka` → opcjonalna |
| `src/lib/categories/canonical-categories.ts` | sync `isDiscretionary` przy seed |
| `src/lib/discretionary/types.ts` | typy widoku |
| `src/lib/discretionary/is-discretionary-transaction.ts` | filtr tx |
| `src/lib/discretionary/compute-discretionary-summary.ts` | sumy, %, delta okresu |
| `src/lib/discretionary/compute-discretionary-merchants.ts` | top N kontrahentów |
| `src/lib/discretionary/load-discretionary-page.ts` | orchestracja Prisma |
| `src/server/actions/discretionary.ts` | limit + revalidate |
| `src/server/actions/categories.ts` | `setCategoryDiscretionary` |
| `src/app/(app)/opcjonalne/page.tsx` | strona raportu |
| `src/components/discretionary/*` | UI |
| `src/components/categories/CategoriesView.tsx` | checkbox „Opcjonalny” |
| `src/components/dashboard/DiscretionaryWidget.tsx` | widget KPI + pasek limitu |
| `src/app/(app)/dashboard/page.tsx` | wpięcie widgetu |
| `src/components/AppNavLinks.tsx` | link menu |
| `src/lib/transactions/page-filters.ts` | `?discretionary=1` |
| `tests/lib/discretionary/*.test.ts` | unit testy |

---

### Task 1: Schema — kategoria opcjonalna + limit miesięczny

**Files:**
- Modify: `prisma/schema.prisma` (model `Category`, nowy `DiscretionaryBudget`)
- Create: `prisma/migrations/20260524140000_discretionary_spending/migration.sql`

- [ ] **Step 1: Rozszerz schema**

W `Category` dodaj po `excludeFromOptimization`:

```prisma
  isDiscretionary          Boolean                  @default(false)
```

Dodaj model (np. po `CategoryBudget`):

```prisma
model DiscretionaryBudget {
  id             String         @id @default(cuid())
  workspaceId    String
  accountContext AccountContext @default(dom)
  monthlyLimit   Decimal        @db.Decimal(12, 2)
  workspace      Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, accountContext])
}
```

W `Workspace` dodaj relację:

```prisma
  discretionaryBudgets DiscretionaryBudget[]
```

- [ ] **Step 2: Utwórz migrację**

```bash
npx prisma migrate dev --name discretionary_spending
```

Expected: migracja OK, `prisma generate` bez błędów.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): discretionary categories and monthly limit"
```

---

### Task 2: Domyślne kategorie — Rozrywka opcjonalna

**Files:**
- Modify: `src/lib/categories/default-categories.ts`
- Modify: `src/lib/categories/canonical-categories.ts`
- Modify: `src/lib/seed-default-categories.ts`
- Modify: `src/lib/categories/ensure-canonical-categories.ts`

- [ ] **Step 1: Rozszerz typ definicji**

W `default-categories.ts` dodaj pole do interfejsu i wpisów:

```typescript
export interface DefaultCategoryDef {
  name: string;
  color: string;
  excludeFromOptimization: boolean;
  isDiscretionary: boolean;
}
```

Ustaw `isDiscretionary: true` tylko dla `{ name: "Rozrywka", ... }`; reszta `false`.

Dodaj helper:

```typescript
export function isDiscretionaryForName(name: string): boolean {
  return DEFAULT_CATEGORIES.find((c) => c.name === name)?.isDiscretionary ?? false;
}
```

- [ ] **Step 2: Sync w ensure-canonical-categories**

W `ensureCanonicalCategories`, przy `upsert`/`update` kategorii kanonicznych — ustaw `isDiscretionary: def.isDiscretionary` (wzorzec jak `excludeFromOptimization`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/categories/ src/lib/seed-default-categories.ts
git commit -m "feat: mark Rozrywka as discretionary by default"
```

---

### Task 3: Pure logic — czy transakcja jest opcjonalna

**Files:**
- Create: `src/lib/discretionary/is-discretionary-transaction.ts`
- Create: `tests/lib/discretionary/is-discretionary-transaction.test.ts`

- [ ] **Step 1: Napisz failing test**

```typescript
// tests/lib/discretionary/is-discretionary-transaction.test.ts
import { describe, expect, it } from "vitest";

import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";

describe("isDiscretionaryExpense", () => {
  it("returns true for negative amount and discretionary category", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-50.00",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: true,
      }),
    ).toBe(true);
  });

  it("returns false for income", () => {
    expect(
      isDiscretionaryExpense({
        amount: "100.00",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: true,
      }),
    ).toBe(false);
  });

  it("returns false when category not discretionary", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-10",
        category: { isDiscretionary: false, name: "Żywność" },
        countsInAnalytics: true,
      }),
    ).toBe(false);
  });

  it("returns false when excluded from analytics", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-10",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: false,
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Uruchom test — oczekiwany FAIL**

```bash
npm run test -- tests/lib/discretionary/is-discretionary-transaction.test.ts
```

Expected: FAIL — moduł nie istnieje.

- [ ] **Step 3: Implementacja**

```typescript
// src/lib/discretionary/is-discretionary-transaction.ts
export interface DiscretionaryTxInput {
  amount: string;
  category: { isDiscretionary: boolean; name: string } | null;
  countsInAnalytics: boolean;
}

export function isDiscretionaryExpense(tx: DiscretionaryTxInput): boolean {
  if (!tx.countsInAnalytics) {
    return false;
  }
  if (!tx.category?.isDiscretionary) {
    return false;
  }
  const value = Number.parseFloat(tx.amount);
  return Number.isFinite(value) && value < 0;
}
```

- [ ] **Step 4: Uruchom test — PASS**

```bash
npm run test -- tests/lib/discretionary/is-discretionary-transaction.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/discretionary/is-discretionary-transaction.ts tests/lib/discretionary/
git commit -m "feat: discretionary expense predicate"
```

---

### Task 4: Pure logic — podsumowanie okresu

**Files:**
- Create: `src/lib/discretionary/types.ts`
- Create: `src/lib/discretionary/compute-discretionary-summary.ts`
- Create: `tests/lib/discretionary/compute-discretionary-summary.test.ts`

- [ ] **Step 1: Typy**

```typescript
// src/lib/discretionary/types.ts
export interface DiscretionaryPeriodSummary {
  totalPln: number;
  transactionCount: number;
  shareOfExpensesPercent: number | null;
  vsPreviousPeriodPercent: number | null;
}

export interface DiscretionaryMerchantRow {
  counterparty: string;
  totalPln: number;
  transactionCount: number;
  vsPreviousPeriodPercent: number | null;
}
```

- [ ] **Step 2: Failing test**

```typescript
import { describe, expect, it } from "vitest";

import { computeDiscretionarySummary } from "@/lib/discretionary/compute-discretionary-summary";

describe("computeDiscretionarySummary", () => {
  it("sums discretionary expenses and share of all expenses", () => {
    const result = computeDiscretionarySummary({
      currentDiscretionaryPln: 300,
      currentDiscretionaryCount: 5,
      currentTotalExpensesPln: 1000,
      previousDiscretionaryPln: 200,
    });
    expect(result.totalPln).toBe(300);
    expect(result.transactionCount).toBe(5);
    expect(result.shareOfExpensesPercent).toBe(30);
    expect(result.vsPreviousPeriodPercent).toBe(50);
  });

  it("returns null share when no expenses", () => {
    const result = computeDiscretionarySummary({
      currentDiscretionaryPln: 0,
      currentDiscretionaryCount: 0,
      currentTotalExpensesPln: 0,
      previousDiscretionaryPln: 0,
    });
    expect(result.shareOfExpensesPercent).toBeNull();
    expect(result.vsPreviousPeriodPercent).toBeNull();
  });
});
```

- [ ] **Step 3: FAIL, potem implementacja**

```typescript
// src/lib/discretionary/compute-discretionary-summary.ts
import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? null : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function computeDiscretionarySummary(input: {
  currentDiscretionaryPln: number;
  currentDiscretionaryCount: number;
  currentTotalExpensesPln: number;
  previousDiscretionaryPln: number;
}): DiscretionaryPeriodSummary {
  const shareOfExpensesPercent =
    input.currentTotalExpensesPln > 0
      ? Math.round(
          (input.currentDiscretionaryPln / input.currentTotalExpensesPln) * 1000,
        ) / 10
      : null;

  return {
    totalPln: input.currentDiscretionaryPln,
    transactionCount: input.currentDiscretionaryCount,
    shareOfExpensesPercent,
    vsPreviousPeriodPercent: percentChange(
      input.currentDiscretionaryPln,
      input.previousDiscretionaryPln,
    ),
  };
}
```

- [ ] **Step 4: PASS + commit**

```bash
npm run test -- tests/lib/discretionary/compute-discretionary-summary.test.ts
git add src/lib/discretionary/types.ts src/lib/discretionary/compute-discretionary-summary.ts tests/lib/discretionary/compute-discretionary-summary.test.ts
git commit -m "feat: compute discretionary period summary"
```

---

### Task 5: Pure logic — top kontrahenci opcjonalni

**Files:**
- Create: `src/lib/discretionary/compute-discretionary-merchants.ts`
- Create: `tests/lib/discretionary/compute-discretionary-merchants.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, expect, it } from "vitest";

import { rankDiscretionaryMerchants } from "@/lib/discretionary/compute-discretionary-merchants";

describe("rankDiscretionaryMerchants", () => {
  it("ranks by spend desc and computes m/m change", () => {
    const rows = rankDiscretionaryMerchants(
      [
        { counterparty: "NETFLIX", currentPln: 50, previousPln: 40, count: 1 },
        { counterparty: "UBER", currentPln: 120, previousPln: 100, count: 4 },
      ],
      5,
    );
    expect(rows[0]?.counterparty).toBe("UBER");
    expect(rows[0]?.totalPln).toBe(120);
    expect(rows[0]?.vsPreviousPeriodPercent).toBe(20);
  });
});
```

- [ ] **Step 2: Implementacja**

```typescript
// src/lib/discretionary/compute-discretionary-merchants.ts
import type { DiscretionaryMerchantRow } from "@/lib/discretionary/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? null : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function rankDiscretionaryMerchants(
  rows: { counterparty: string; currentPln: number; previousPln: number; count: number }[],
  limit: number,
): DiscretionaryMerchantRow[] {
  return [...rows]
    .sort((a, b) => b.currentPln - a.currentPln)
    .slice(0, limit)
    .map((row) => ({
      counterparty: row.counterparty,
      totalPln: row.currentPln,
      transactionCount: row.count,
      vsPreviousPeriodPercent: percentChange(row.currentPln, row.previousPln),
    }));
}
```

- [ ] **Step 3: PASS + commit**

```bash
npm run test -- tests/lib/discretionary/compute-discretionary-merchants.test.ts
git add src/lib/discretionary/compute-discretionary-merchants.ts tests/lib/discretionary/compute-discretionary-merchants.test.ts
git commit -m "feat: rank discretionary merchants"
```

---

### Task 6: Loader strony `/opcjonalne`

**Files:**
- Create: `src/lib/discretionary/map-transactions-for-discretionary.ts`
- Create: `src/lib/discretionary/load-discretionary-page.ts`

Wzoruj się na `load-dashboard-metrics.ts`: `fetch` transakcji z `include: { category: true }`, `buildPairedOwnAccountTransferKeys`, filtr `shouldCountInAnalytics`.

- [ ] **Step 1: Mapowanie kwot**

```typescript
// src/lib/discretionary/map-transactions-for-discretionary.ts
import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";

export function discretionaryAmountPln(amount: string): number {
  const value = Number.parseFloat(amount);
  return Number.isFinite(value) && value < 0 ? Math.abs(value) : 0;
}

export function sumDiscretionaryPln(
  transactions: {
    amount: string;
    category: { isDiscretionary: boolean; name: string } | null;
    countsInAnalytics: boolean;
  }[],
): { totalPln: number; count: number } {
  let totalPln = 0;
  let count = 0;
  for (const tx of transactions) {
    if (!isDiscretionaryExpense(tx)) {
      continue;
    }
    totalPln += discretionaryAmountPln(tx.amount);
    count += 1;
  }
  return { totalPln, count };
}

export function sumExpensePln(
  transactions: { amount: string; countsInAnalytics: boolean }[],
): number {
  let total = 0;
  for (const tx of transactions) {
    if (!tx.countsInAnalytics) {
      continue;
    }
    const value = Number.parseFloat(tx.amount);
    if (Number.isFinite(value) && value < 0) {
      total += Math.abs(value);
    }
  }
  return total;
}
```

- [ ] **Step 2: Loader (bez testu integracyjnego — logika pokryta unitami)**

`loadDiscretionaryPageData(workspaceId, context, range)` zwraca:

```typescript
{
  summary: DiscretionaryPeriodSummary;
  merchants: DiscretionaryMerchantRow[];
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  discretionaryCategoryIds: string[];
  coveragePercent: number; // % wydatków w okresie z kategorią (dowolna)
}
```

Agregacja merchantów: grupuj po `counterparty` w current/previous.

`coveragePercent`: jak dashboard — % tx z `categoryId != null` wśród wydatków.

- [ ] **Step 3: Commit**

```bash
git add src/lib/discretionary/
git commit -m "feat: load discretionary page aggregates"
```

---

### Task 7: Server actions — limit i toggle kategorii

**Files:**
- Modify: `src/server/actions/categories.ts`
- Create: `src/server/actions/discretionary.ts`
- Modify: `src/app/(app)/categories/page.tsx`
- Modify: `src/components/categories/CategoriesView.tsx`

- [ ] **Step 1: `setCategoryDiscretionary` w categories.ts**

Wzoruj na `setCategoryOptimizationExclusion`:

```typescript
export async function setCategoryDiscretionary(
  categoryId: string,
  isDiscretionary: boolean,
): Promise<{ ok: boolean; error?: string }> {
  // auth, updateMany where workspaceId + categoryId
  // revalidatePath: /categories, /opcjonalne, /dashboard, /transactions
}
```

- [ ] **Step 2: `discretionary.ts`**

```typescript
"use server";
// upsertDiscretionaryBudget(context: string, monthlyLimit: number)
// — walidacja contextSchema, monthlyLimit > 0, max 999_999
// prisma.discretionaryBudget.upsert po workspaceId_accountContext
```

- [ ] **Step 3: UI checkbox na CategoriesView**

Obok `FixedExpenseToggle` dodaj `DiscretionaryToggle` z etykietą **„Wydatek opcjonalny”** (tip: „Wliczane do raportu głupot / opcjonalnych na /opcjonalne”).

- [ ] **Step 4: Ręczny smoke**

```bash
npm run dev
# /categories — zaznacz Rozrywka jako opcjonalny, odznacz Żywność
```

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/categories.ts src/server/actions/discretionary.ts src/app/(app)/categories/ src/components/categories/
git commit -m "feat: toggle discretionary category and monthly limit action"
```

---

### Task 8: Strona `/opcjonalne`

**Files:**
- Create: `src/app/(app)/opcjonalne/page.tsx`
- Create: `src/components/discretionary/DiscretionaryPageClient.tsx`
- Create: `src/components/discretionary/DiscretionarySummaryCards.tsx`
- Create: `src/components/discretionary/DiscretionaryLimitEditor.tsx`
- Create: `src/components/discretionary/DiscretionaryMerchantsTable.tsx`
- Modify: `src/components/AppNavLinks.tsx`

- [ ] **Step 1: page.tsx (server)**

Parametry URL jak dashboard: `context`, `period`, `year`, `month` — użyj `resolveDateRange` + `loadDashboardPageContext` / `fetchAccountIds` z istniejących helperów.

```tsx
// PageHeader title="Wydatki opcjonalne"
// lead="To, na co możecie się wspólnie zgodzić, że da się ograniczyć…"
// actions: ContextToggle basePath="/opcjonalne" + MonthPicker/YearPicker jeśli już są
// <DiscretionaryPageClient ... />
```

- [ ] **Step 2: Summary cards**

Karty (użyj `AmountValue`):
1. **Suma opcjonalnych** + delta % vs poprzedni okres
2. **Udział w wydatkach** (%)
3. **Limit miesięczny** — pasek postępu (zielony <80%, żółty 80–100%, czerwony >100%) lub „Nie ustawiono”

- [ ] **Step 3: Limit editor**

Formularz: input number PLN + Zapisz → `upsertDiscretionaryBudget`. Domyślny kontekst edycji: `dom`.

- [ ] **Step 4: Tabela top 5**

Kolumny: Kontrahent | Kwota | Zmiana m/m | Link „Transakcje →” (`/transactions?counterparty=...&...`).

- [ ] **Step 5: Baner pokrycia**

Jeśli `coveragePercent < 80`: żółty baner „X% wydatków ma kategorię — wnioski mogą być niepełne” + link `/transactions?uncategorized=1`.

- [ ] **Step 6: Nav link**

```typescript
{
  href: "/opcjonalne",
  label: "Opcjonalne",
  tip: "Wydatki, na które możecie się zgodzić, że da się je ograniczyć.",
},
```

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/opcjonalne/ src/components/discretionary/ src/components/AppNavLinks.tsx
git commit -m "feat: discretionary spending report page"
```

---

### Task 9: Widget na dashboardzie

**Files:**
- Create: `src/components/dashboard/DiscretionaryWidget.tsx`
- Modify: `src/lib/analytics/load-dashboard-page.ts` (lub `load-dashboard.ts`) — dołącz `discretionarySummary` + `discretionaryLimit`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rozszerz `DashboardData` w `dashboard-types.ts`**

```typescript
discretionary?: {
  summary: DiscretionaryPeriodSummary;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
};
```

- [ ] **Step 2: Widget**

Sekcja `section-card border-orange-200` (spójnie z recurring):
- Tytuł: **Wydatki opcjonalne**
- Jedna linia: suma PLN, % budżetu, % wszystkich wydatków
- Mini pasek limitu jeśli ustawiony
- Link **Szczegóły →** `/opcjonalne?context=...`

Pokaż widget tylko gdy `summary.totalPln > 0` LUB `monthlyLimit != null` LUB istnieje ≥1 kategoria `isDiscretionary`.

- [ ] **Step 3: Wpięcie pod `PeriodSummaryCards` na dashboardzie**

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/DiscretionaryWidget.tsx src/lib/analytics/ src/app/(app)/dashboard/page.tsx
git commit -m "feat: discretionary widget on dashboard"
```

---

### Task 10: Filtr transakcji opcjonalnych

**Files:**
- Modify: `src/lib/transactions/page-filters.ts`
- Modify: `src/lib/transactions/load-transactions-page.ts`
- Modify: `src/components/transactions/TransactionsPageClient.tsx` (opcjonalnie chip „Tylko opcjonalne”)

- [ ] **Step 1: `discretionary=1` w page-filters**

Rozszerz `parseTransactionFilters` — gdy `discretionary === "1"`, `where.category = { isDiscretionary: true }` (+ nadal workspace/account).

- [ ] **Step 2: Link z /opcjonalne**

Przycisk „Wszystkie transakcje opcjonalne” → `/transactions?context=dom&discretionary=1`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/transactions/ src/components/transactions/
git commit -m "feat: filter transactions to discretionary categories"
```

---

### Task 11: Dokumentacja użytkownika

**Files:**
- Modify: `docs/user-guide.md`

- [ ] **Step 1: Sekcja „Wydatki opcjonalne”**

Opisz workflow z analizy JTBD:
1. Oznacz kategorie na `/categories`
2. Ustaw limit na `/opcjonalne`
3. Co miesiąc: dashboard → opcjonalne → 1 decyzja
4. Para: wspólny workspace, nie per osoba — tagi opcjonalne dla „kto” (np. tag `Adam`, `Żona`) bez zmian w kodzie

- [ ] **Step 2: Commit**

```bash
git add docs/user-guide.md
git commit -m "docs: discretionary spending user guide"
```

---

### Task 12: Weryfikacja końcowa

- [ ] **Step 1: Pełny check**

```bash
npm run lint
npm run typecheck
npm run test -- tests/lib/discretionary
npm run test
```

Expected: wszystko PASS.

- [ ] **Step 2: Smoke E2E (jeśli DB lokalna)**

```bash
npm run demo:seed
npm run test:smoke
```

- [ ] **Step 3: Commit końcowy tylko jeśli poprawki**

---

## Self-review (spec → plan)

| Wymaganie JTBD | Task |
|----------------|------|
| Zrozumieć gdzie idą „głupoty” | 3–6, 8 (raport + top merchant) |
| Mniej wydawać (limit + %) | 4, 7, 8 (limit editor + pasek) |
| Skategoryzować | 1–2, 7 (checkbox kategorii) |
| Wnioski (trend, delta, top 5) | 4–5, 8–9 |
| Para (wspólny workspace) | zakres planu; user-guide tagi |
| Ja + żona osobno | poza zakresem — tylko wzmianka w docs |

**Placeholder scan:** brak TBD.

**Nazewnictwo spójne:** `isDiscretionary`, `DiscretionaryBudget`, `/opcjonalne`, `discretionary=1`.

---

## Execution Handoff

Plan zapisany w `docs/superpowers/plans/2026-05-24-discretionary-spending.md`.

**Dwie opcje wdrożenia:**

1. **Subagent-Driven (zalecane)** — osobny subagent na task, review między taskami (`superpowers:subagent-driven-development`).

2. **Inline Execution** — realizacja w tej sesji partiami (`superpowers:executing-plans`).

Którą opcję wybierasz?
