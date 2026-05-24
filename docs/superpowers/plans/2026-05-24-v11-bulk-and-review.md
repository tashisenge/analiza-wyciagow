# v1.1 — Masowa kategoryzacja i weryfikacja mBank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umożliwić zmianę kategorii dla wielu transakcji naraz (filtry + zaznaczenie) oraz kolejkę weryfikacji rozbieżności mBank vs app z sugestiami AI — bez automatycznego nadpisywania.

**Architecture:** Warstwa lib buduje bezpieczne filtry Prisma z `workspaceId` (wzorzec `delete-scoped.ts` / `find-similar-transaction-ids.ts`). Masowa aktualizacja idzie przez `updateMany` w batchach po max 500 ID. Kolejka review to czyste zapytanie + funkcja `needsMbankReview`; AI zwraca sugestie JSON (jak `categorize-batch.ts`), decyzja użytkownika przez osobne server actions. UI: panel masowy na `/transactions`, nowa strona `/review`, link w nav i baner na dashboardzie.

**Tech Stack:** Next.js 15, Prisma 6, PostgreSQL, Zod, Vitest, Playwright smoke

**Spec:** `docs/superpowers/specs/2026-05-22-feature-roadmap-v11.md` (§ Priorytet 1: punkty 2 i 4)

**Stan wyjściowy (już zrobione):** Pojedyncza kategoryzacja z „podobnymi” (`updateTransactionCategory`), filtry kontekstu/kategorii/kontrahenta/tagów na `/transactions`, pamięć kontrahenta (`MerchantCategoryMemory`), AI batch (`categorize-batch.ts`), mapowanie mBank 1:1, baner „X bez kategorii” na dashboardzie.

---

## Mapa plików (ten plan)

| Plik | Odpowiedzialność |
| ---- | ---------------- |
| `src/lib/transactions/bulk-category-types.ts` | Typy filtrów i wyników masowej aktualizacji |
| `src/lib/transactions/bulk-category-filter.ts` | Budowa `Prisma.TransactionWhereInput` z filtrów + workspace |
| `src/lib/transactions/apply-bulk-category.ts` | Orkiestracja updateMany + pamięć kontrahenta (max 500) |
| `src/lib/transactions/page-filters.ts` | Rozszerzenie o `dateFrom`, `dateTo`, `mbankCategory` |
| `src/server/actions/bulk-category.ts` | `previewBulkCategoryUpdate`, `bulkUpdateCategory` |
| `src/components/transactions/BulkCategoryPanel.tsx` | Formularz filtrów, podgląd N, submit (client) |
| `src/components/transactions/TransactionDateFilters.tsx` | Pola dat od–do w URL |
| `src/app/(app)/transactions/page.tsx` | Podpięcie panelu masowego |
| `src/lib/review/needs-mbank-review.ts` | Czy transakcja kwalifikuje się do kolejki |
| `src/lib/review/build-review-queue-where.ts` | Filtr Prisma dla kolejki review |
| `src/lib/review/load-review-queue.ts` | Ładowanie strony review (paginacja) |
| `src/lib/ai/prompts/mbank-verify.ts` | System prompt weryfikacji mBank |
| `src/lib/ai/verify-mbank-assignments.ts` | Parsowanie JSON sugestii AI |
| `src/lib/ai/run-mbank-verify-batch.ts` | Batch do 50 tx → sugestie |
| `src/server/actions/review.ts` | `loadReviewCount`, `aiVerifyReviewBatch`, `applyReviewDecision` |
| `src/components/review/ReviewQueueTable.tsx` | Tabela z akcjami Zaakceptuj mBank / app / inna / Pomiń |
| `src/components/review/ReviewAiBatchButton.tsx` | Przycisk „Zweryfikuj 50 z AI” (client) |
| `src/app/(app)/review/page.tsx` | Strona kolejki weryfikacji |
| `src/components/AppNavLinks.tsx` | Link „Weryfikacja” |
| `src/app/(app)/dashboard/page.tsx` | Baner link do `/review` gdy count > 0 |
| `tests/lib/bulk-category-filter.test.ts` | Unit filtrów |
| `tests/lib/needs-mbank-review.test.ts` | Unit logiki kolejki |
| `tests/lib/verify-mbank-assignments.test.ts` | Unit parse JSON AI |
| `tests/e2e/review-smoke.spec.ts` | Smoke: strona review 200 |

---

### Task 1: Typy i stałe masowej kategoryzacji

**Files:**
- Create: `src/lib/transactions/bulk-category-types.ts`

- [ ] **Step 1: Utwórz plik typów**

```typescript
import type { AccountContext } from "@prisma/client";

export const BULK_CATEGORY_MAX = 500;

export interface BulkCategoryFilters {
  /** Fragment kontrahenta (case-insensitive contains) */
  counterpartyContains?: string;
  /** Dokładna nazwa kategorii mBank (po normalizacji) */
  mbankCategory?: string;
  /** Tylko transakcje bez categoryId */
  uncategorizedOnly?: boolean;
  /** Zakres dat inclusive (ISO date YYYY-MM-DD) */
  dateFrom?: string;
  dateTo?: string;
  /** Kontekst kont: firma | dom | razem */
  context?: AccountContext;
}

export interface BulkCategoryPreviewResult {
  count: number;
  capped: boolean;
  sampleIds: string[];
}

export interface BulkCategoryApplyResult {
  updatedCount: number;
  rememberedMerchants: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/transactions/bulk-category-types.ts
git commit -m "feat: typy filtrów masowej kategoryzacji"
```

---

### Task 2: Filtr Prisma dla masowej kategoryzacji

**Files:**
- Create: `src/lib/transactions/bulk-category-filter.ts`
- Test: `tests/lib/bulk-category-filter.test.ts`

- [ ] **Step 1: Napisz test**

```typescript
import { describe, expect, it } from "vitest";

import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";

describe("buildBulkCategoryWhere", () => {
  it("scopes to workspace and account ids", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a", "acc-b"],
      filters: {},
    });
    expect(where).toEqual({
      workspaceId: "ws-1",
      accountId: { in: ["acc-a", "acc-b"] },
    });
  });

  it("adds counterparty contains filter", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { counterpartyContains: "lidl" },
    });
    expect(where.counterparty).toEqual({
      contains: "lidl",
      mode: "insensitive",
    });
  });

  it("adds uncategorized filter", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { uncategorizedOnly: true },
    });
    expect(where.categoryId).toBeNull();
  });

  it("adds date range on bookedAt", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
    });
    expect(where.bookedAt).toEqual({
      gte: new Date("2026-01-01T00:00:00.000Z"),
      lte: new Date("2026-01-31T23:59:59.999Z"),
    });
  });

  it("filters mbank category case-insensitive", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { mbankCategory: "Żywność i chemia domowa" },
    });
    expect(where.mbankCategory).toEqual({
      equals: "Żywność i chemia domowa",
      mode: "insensitive",
    });
  });
});
```

- [ ] **Step 2: Uruchom test — FAIL**

Run: `npm test -- tests/lib/bulk-category-filter.test.ts`
Expected: FAIL — `buildBulkCategoryWhere` not defined

- [ ] **Step 3: Implementacja**

```typescript
import type { Prisma } from "@prisma/client";

import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

export interface BuildBulkCategoryWhereInput {
  workspaceId: string;
  accountIds: string[];
  filters: BulkCategoryFilters;
  transactionIds?: string[];
}

function parseDateStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function parseDateEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

export function buildBulkCategoryWhere(
  input: BuildBulkCategoryWhereInput,
): Prisma.TransactionWhereInput {
  const { workspaceId, accountIds, filters, transactionIds } = input;

  const where: Prisma.TransactionWhereInput = {
    workspaceId,
    accountId: { in: accountIds },
  };

  if (transactionIds && transactionIds.length > 0) {
    where.id = { in: transactionIds };
  }

  if (filters.counterpartyContains?.trim()) {
    where.counterparty = {
      contains: filters.counterpartyContains.trim(),
      mode: "insensitive",
    };
  }

  if (filters.mbankCategory?.trim()) {
    where.mbankCategory = {
      equals: filters.mbankCategory.trim(),
      mode: "insensitive",
    };
  }

  if (filters.uncategorizedOnly) {
    where.categoryId = null;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.bookedAt = {};
    if (filters.dateFrom) {
      where.bookedAt.gte = parseDateStart(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.bookedAt.lte = parseDateEnd(filters.dateTo);
    }
  }

  return where;
}
```

- [ ] **Step 4: Uruchom test — PASS**

Run: `npm test -- tests/lib/bulk-category-filter.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/transactions/bulk-category-filter.ts tests/lib/bulk-category-filter.test.ts
git commit -m "feat: filtr Prisma dla masowej kategoryzacji"
```

---

### Task 3: Orkiestracja masowej aktualizacji (lib)

**Files:**
- Create: `src/lib/transactions/apply-bulk-category.ts`
- Test: `tests/lib/apply-bulk-category.test.ts`

- [ ] **Step 1: Napisz test (mock prisma)**

```typescript
import { describe, expect, it, vi } from "vitest";

import { applyBulkCategoryUpdate } from "@/lib/transactions/apply-bulk-category";

describe("applyBulkCategoryUpdate", () => {
  it("updates transactions and remembers unique counterparties", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([
          { id: "t1", counterparty: "LIDL" },
          { id: "t2", counterparty: "LIDL" },
        ]),
        updateMany,
      },
      merchantCategoryMemory: { upsert },
    };

    const result = await applyBulkCategoryUpdate({
      prisma: prisma as never,
      workspaceId: "ws-1",
      transactionIds: ["t1", "t2"],
      categoryId: "cat-1",
      rememberMerchant: true,
    });

    expect(result.updatedCount).toBe(2);
    expect(result.rememberedMerchants).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", id: { in: ["t1", "t2"] } },
      data: { categoryId: "cat-1" },
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("clears category when categoryId is null", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([{ id: "t1", counterparty: "" }]),
        updateMany,
      },
      merchantCategoryMemory: { upsert: vi.fn() },
    };

    const result = await applyBulkCategoryUpdate({
      prisma: prisma as never,
      workspaceId: "ws-1",
      transactionIds: ["t1"],
      categoryId: null,
      rememberMerchant: false,
    });

    expect(result.updatedCount).toBe(1);
    expect(result.rememberedMerchants).toBe(0);
    expect(updateMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", id: { in: ["t1"] } },
      data: { categoryId: null },
    });
  });
});
```

- [ ] **Step 2: Uruchom test — FAIL**

Run: `npm test -- tests/lib/apply-bulk-category.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementacja**

```typescript
import type { PrismaClient } from "@prisma/client";

import { BULK_CATEGORY_MAX, type BulkCategoryApplyResult } from "@/lib/transactions/bulk-category-types";

export interface ApplyBulkCategoryInput {
  prisma: PrismaClient;
  workspaceId: string;
  transactionIds: string[];
  categoryId: string | null;
  rememberMerchant: boolean;
}

export async function applyBulkCategoryUpdate(
  input: ApplyBulkCategoryInput,
): Promise<BulkCategoryApplyResult> {
  const ids = input.transactionIds.slice(0, BULK_CATEGORY_MAX);
  if (ids.length === 0) {
    return { updatedCount: 0, rememberedMerchants: 0 };
  }

  const rows = await input.prisma.transaction.findMany({
    where: { workspaceId: input.workspaceId, id: { in: ids } },
    select: { id: true, counterparty: true },
  });

  const validIds = rows.map((row) => row.id);
  if (validIds.length === 0) {
    return { updatedCount: 0, rememberedMerchants: 0 };
  }

  const { count } = await input.prisma.transaction.updateMany({
    where: { workspaceId: input.workspaceId, id: { in: validIds } },
    data: { categoryId: input.categoryId },
  });

  let rememberedMerchants = 0;
  if (input.categoryId && input.rememberMerchant) {
    const counterparties = new Set<string>();
    for (const row of rows) {
      const key = row.counterparty.trim();
      if (key) {
        counterparties.add(key);
      }
    }
    for (const counterparty of counterparties) {
      await input.prisma.merchantCategoryMemory.upsert({
        where: {
          workspaceId_counterparty: {
            workspaceId: input.workspaceId,
            counterparty,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          counterparty,
          categoryId: input.categoryId,
        },
        update: { categoryId: input.categoryId },
      });
      rememberedMerchants += 1;
    }
  }

  return { updatedCount: count, rememberedMerchants };
}
```

- [ ] **Step 4: Uruchom test — PASS**

Run: `npm test -- tests/lib/apply-bulk-category.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/transactions/apply-bulk-category.ts tests/lib/apply-bulk-category.test.ts
git commit -m "feat: orkiestracja masowej aktualizacji kategorii"
```

---

### Task 4: Server actions — preview i bulk update

**Files:**
- Create: `src/server/actions/bulk-category.ts`

- [ ] **Step 1: Implementacja actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { accountIdsForContext } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { applyBulkCategoryUpdate } from "@/lib/transactions/apply-bulk-category";
import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";
import {
  BULK_CATEGORY_MAX,
  type BulkCategoryFilters,
  type BulkCategoryPreviewResult,
} from "@/lib/transactions/bulk-category-types";

export type BulkCategoryActionResult =
  | { ok: true; updatedCount: number; rememberedMerchants: number }
  | { ok: false; error: string };

export type BulkPreviewActionResult =
  | { ok: true; preview: BulkCategoryPreviewResult }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const filtersSchema = z.object({
  counterpartyContains: z.string().optional(),
  mbankCategory: z.string().optional(),
  uncategorizedOnly: z.boolean().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  context: z.enum(["firma", "dom", "razem"]).optional(),
});

const bulkUpdateSchema = z.object({
  categoryId: z.string().min(1, "Wybierz kategorię"),
  rememberMerchant: z.boolean().default(false),
  transactionIds: z.array(z.string()).optional(),
  filters: filtersSchema.optional(),
});

async function resolveAccountIds(
  workspaceId: string,
  context: BulkCategoryFilters["context"],
): Promise<string[]> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  return accountIdsForContext(accounts, context ?? "razem");
}

async function resolveTargetIds(
  workspaceId: string,
  accountIds: string[],
  filters: BulkCategoryFilters,
  transactionIds?: string[],
): Promise<string[]> {
  if (transactionIds && transactionIds.length > 0) {
    const rows = await prisma.transaction.findMany({
      where: buildBulkCategoryWhere({
        workspaceId,
        accountIds,
        filters: {},
        transactionIds,
      }),
      select: { id: true },
      take: BULK_CATEGORY_MAX,
    });
    return rows.map((row) => row.id);
  }

  const rows = await prisma.transaction.findMany({
    where: buildBulkCategoryWhere({ workspaceId, accountIds, filters }),
    select: { id: true },
    orderBy: { bookedAt: "desc" },
    take: BULK_CATEGORY_MAX,
  });
  return rows.map((row) => row.id);
}

export async function previewBulkCategoryUpdate(
  filters: BulkCategoryFilters,
): Promise<BulkPreviewActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const accountIds = await resolveAccountIds(workspaceId, filters.context);
    const total = await prisma.transaction.count({
      where: buildBulkCategoryWhere({ workspaceId, accountIds, filters }),
    });
    const ids = await resolveTargetIds(workspaceId, accountIds, filters);
    return {
      ok: true,
      preview: {
        count: total,
        capped: total > BULK_CATEGORY_MAX,
        sampleIds: ids.slice(0, 5),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("bulkCategory.preview", error, { context: { workspaceId } }),
    };
  }
}

export async function bulkUpdateCategory(input: {
  categoryId: string;
  rememberMerchant?: boolean;
  transactionIds?: string[];
  filters?: BulkCategoryFilters;
}): Promise<BulkCategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = bulkUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nieprawidłowa kategoria" };
  }

  const filters = parsed.data.filters ?? {};
  const hasSelection =
    (parsed.data.transactionIds?.length ?? 0) > 0 ||
    Boolean(filters.counterpartyContains?.trim()) ||
    Boolean(filters.mbankCategory?.trim()) ||
    filters.uncategorizedOnly ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  if (!hasSelection) {
    return { ok: false, error: "Ustaw filtr lub zaznacz transakcje" };
  }

  try {
    const accountIds = await resolveAccountIds(workspaceId, filters.context);
    const targetIds = await resolveTargetIds(
      workspaceId,
      accountIds,
      filters,
      parsed.data.transactionIds,
    );

    if (targetIds.length === 0) {
      return { ok: false, error: "Brak transakcji spełniających kryteria" };
    }

    const result = await applyBulkCategoryUpdate({
      prisma,
      workspaceId,
      transactionIds: targetIds,
      categoryId: parsed.data.categoryId,
      rememberMerchant: parsed.data.rememberMerchant,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/categories");
    revalidatePath("/review");

    return {
      ok: true,
      updatedCount: result.updatedCount,
      rememberedMerchants: result.rememberedMerchants,
    };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("bulkCategory.update", error, { context: { workspaceId } }),
    };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors in bulk-category.ts)

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/bulk-category.ts
git commit -m "feat: server actions podglądu i masowej kategoryzacji"
```

---

### Task 5: Rozszerzenie filtrów strony transakcji (daty + mBank)

**Files:**
- Modify: `src/lib/transactions/page-filters.ts`
- Modify: `src/lib/transactions/load-transactions-page.ts`
- Test: `tests/lib/page-filters.test.ts`

- [ ] **Step 1: Dodaj testy dat i mbankCategory**

W `tests/lib/page-filters.test.ts` dopisz:

```typescript
  it("builds return URL with date range", () => {
    const url = buildTransactionsReturnTo({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    });
    expect(url).toContain("dateFrom=2026-01-01");
    expect(url).toContain("dateTo=2026-01-31");
  });
```

- [ ] **Step 2: Uruchom test — FAIL**

Run: `npm test -- tests/lib/page-filters.test.ts`
Expected: FAIL — brak pól dateFrom/dateTo w typie

- [ ] **Step 3: Rozszerz `page-filters.ts`**

```typescript
export interface TransactionSearchParams {
  uncategorized?: string;
  context?: string;
  categoryId?: string;
  categoryName?: string;
  counterparty?: string;
  tagId?: string;
  mbankCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  msg?: string;
}

// w buildTransactionsReturnTo dodaj:
  if (params.mbankCategory) {
    search.set("mbankCategory", params.mbankCategory);
  }
  if (params.dateFrom) {
    search.set("dateFrom", params.dateFrom);
  }
  if (params.dateTo) {
    search.set("dateTo", params.dateTo);
  }
```

- [ ] **Step 4: W `load-transactions-page.ts` w `fetchTransactionsBundle` dodaj do where:**

```typescript
          ...(params.mbankCategory
            ? {
                mbankCategory: {
                  equals: params.mbankCategory,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(params.dateFrom || params.dateTo
            ? {
                bookedAt: {
                  ...(params.dateFrom
                    ? { gte: new Date(`${params.dateFrom}T00:00:00.000Z`) }
                    : {}),
                  ...(params.dateTo
                    ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) }
                    : {}),
                },
              }
            : {}),
```

- [ ] **Step 5: Uruchom testy — PASS**

Run: `npm test -- tests/lib/page-filters.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/transactions/page-filters.ts src/lib/transactions/load-transactions-page.ts tests/lib/page-filters.test.ts
git commit -m "feat: filtry dat i kategorii mBank na liście transakcji"
```

---

### Task 6: UI — panel masowej kategoryzacji

**Files:**
- Create: `src/components/transactions/BulkCategoryPanel.tsx`
- Create: `src/components/transactions/TransactionDateFilters.tsx`
- Modify: `src/app/(app)/transactions/page.tsx`

- [ ] **Step 1: Komponent filtrów dat**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function TransactionDateFilters(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");

  function applyDates(): void {
    const params = new URLSearchParams(searchParams.toString());
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    } else {
      params.delete("dateFrom");
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    } else {
      params.delete("dateTo");
    }
    startTransition(() => {
      router.push(`/transactions?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-600">
        Od
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input-field ml-1 text-xs"
        />
      </label>
      <label className="text-xs text-slate-600">
        Do
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input-field ml-1 text-xs"
        />
      </label>
      <button
        type="button"
        onClick={applyDates}
        disabled={pending}
        className="btn-secondary text-xs"
      >
        Zastosuj daty
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Panel masowy (client)**

```tsx
"use client";

import { useState, useTransition } from "react";

import { InfoTip } from "@/components/ui/InfoTip";
import {
  bulkUpdateCategory,
  previewBulkCategoryUpdate,
} from "@/server/actions/bulk-category";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

interface CategoryOption {
  id: string;
  name: string;
}

interface BulkCategoryPanelProps {
  categories: CategoryOption[];
  initialFilters: BulkCategoryFilters;
  selectedIds: string[];
}

export function BulkCategoryPanel({
  categories,
  initialFilters,
  selectedIds,
}: BulkCategoryPanelProps): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCapped, setPreviewCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [rememberMerchant, setRememberMerchant] = useState(true);
  const [counterpartyContains, setCounterpartyContains] = useState(
    initialFilters.counterpartyContains ?? "",
  );
  const [mbankCategory, setMbankCategory] = useState(initialFilters.mbankCategory ?? "");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(
    initialFilters.uncategorizedOnly ?? false,
  );

  function currentFilters(): BulkCategoryFilters {
    return {
      ...initialFilters,
      counterpartyContains: counterpartyContains.trim() || undefined,
      mbankCategory: mbankCategory.trim() || undefined,
      uncategorizedOnly: uncategorizedOnly || undefined,
    };
  }

  function runPreview(): void {
    setError(null);
    startTransition(async () => {
      const result = await previewBulkCategoryUpdate(currentFilters());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreviewCount(result.preview.count);
      setPreviewCapped(result.preview.capped);
    });
  }

  function runBulkUpdate(): void {
    setError(null);
    setSuccess(null);
    if (!categoryId) {
      setError("Wybierz kategorię docelową");
      return;
    }
    startTransition(async () => {
      const result = await bulkUpdateCategory({
        categoryId,
        rememberMerchant,
        transactionIds: selectedIds.length > 0 ? selectedIds : undefined,
        filters: selectedIds.length > 0 ? initialFilters : currentFilters(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Zaktualizowano ${String(result.updatedCount)} transakcji` +
          (result.rememberedMerchants > 0
            ? ` (zapamiętano ${String(result.rememberedMerchants)} kontrahentów)`
            : ""),
      );
      setPreviewCount(null);
    });
  }

  return (
    <section className="section-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Masowa kategoryzacja</h2>
        <InfoTip label="Masowa kategoryzacja">
          Ustaw filtry, sprawdź liczbę transakcji, wybierz kategorię i zastosuj. Max 500 na
          operację. Możesz też zaznaczyć wiersze w tabeli poniżej.
        </InfoTip>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-600">
          Kontrahent zawiera
          <input
            value={counterpartyContains}
            onChange={(e) => setCounterpartyContains(e.target.value)}
            className="input-field mt-1 w-full text-xs"
            placeholder="np. LIDL"
          />
        </label>
        <label className="text-xs text-slate-600">
          Kategoria mBank
          <input
            value={mbankCategory}
            onChange={(e) => setMbankCategory(e.target.value)}
            className="input-field mt-1 w-full text-xs"
            placeholder="np. Żywność i chemia domowa"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={uncategorizedOnly}
            onChange={(e) => setUncategorizedOnly(e.target.checked)}
          />
          Tylko bez kategorii app
        </label>
      </div>
      {selectedIds.length > 0 ? (
        <p className="text-xs text-brand-700">
          Zaznaczono {String(selectedIds.length)} transakcji na liście (max 500).
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={runPreview} disabled={pending} className="btn-secondary text-xs">
          Podgląd liczby
        </button>
        {previewCount !== null ? (
          <span className="text-sm text-slate-700">
            Zostanie zaktualizowanych: <strong>{String(previewCount)}</strong>
            {previewCapped ? " (pierwsze 500 w operacji)" : null}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input-field text-xs"
          aria-label="Kategoria docelowa"
        >
          <option value="">— wybierz kategorię —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={rememberMerchant}
            onChange={(e) => setRememberMerchant(e.target.checked)}
          />
          Zapamiętaj dla kontrahentów
        </label>
        <button type="button" onClick={runBulkUpdate} disabled={pending} className="btn-primary text-xs">
          Zastosuj kategorię
        </button>
      </div>
      {error ? <p className="alert-error text-sm">{error}</p> : null}
      {success ? <p className="alert-success text-sm">{success}</p> : null}
    </section>
  );
}
```

- [ ] **Step 3: Wrapper ze stanem zaznaczenia + podpięcie w `transactions/page.tsx`**

Utwórz `src/components/transactions/TransactionsPageClient.tsx`:

```tsx
"use client";

import { useState } from "react";

import { BulkCategoryPanel } from "@/components/transactions/BulkCategoryPanel";
import { TransactionDateFilters } from "@/components/transactions/TransactionDateFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

// ... przenieś typy TransactionRow/CategoryOption z TransactionsTable

interface TransactionsPageClientProps {
  rows: /* TransactionRow[] */;
  categories: { id: string; name: string }[];
  allTags: { id: string; name: string; color: string }[];
  returnTo: string;
  bulkFilters: BulkCategoryFilters;
  changeCategoryAction: (formData: FormData) => Promise<void>;
}

export function TransactionsPageClient(props: TransactionsPageClientProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleId(id: string): void {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 500),
    );
  }

  return (
    <div className="space-y-4">
      <TransactionDateFilters />
      <BulkCategoryPanel
        categories={props.categories}
        initialFilters={props.bulkFilters}
        selectedIds={selectedIds}
      />
      <TransactionsTable
        {...props}
        selectedIds={selectedIds}
        onToggleSelect={toggleId}
      />
    </div>
  );
}
```

W `TransactionsTable.tsx` dodaj opcjonalną kolumnę checkbox (pierwsza kolumna) gdy przekazano `selectedIds` + `onToggleSelect`.

W `transactions/page.tsx` zbuduj `bulkFilters` z searchParams:

```typescript
  const bulkFilters: BulkCategoryFilters = {
    counterpartyContains: params.counterparty,
    mbankCategory: params.mbankCategory,
    uncategorizedOnly: params.uncategorized === "1",
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    context: context === "razem" ? "razem" : context,
  };
```

Zastąp bezpośrednie `<TransactionsTable />` komponentem `<TransactionsPageClient />`.

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/BulkCategoryPanel.tsx src/components/transactions/TransactionDateFilters.tsx src/components/transactions/TransactionsPageClient.tsx src/components/transactions/TransactionsTable.tsx src/app/(app)/transactions/page.tsx
git commit -m "feat: panel masowej kategoryzacji na stronie transakcji"
```

---

### Task 7: Logika kolejki review — needsMbankReview

**Files:**
- Create: `src/lib/review/needs-mbank-review.ts`
- Test: `tests/lib/needs-mbank-review.test.ts`

- [ ] **Step 1: Napisz test**

```typescript
import { describe, expect, it } from "vitest";

import { needsMbankReview } from "@/lib/review/needs-mbank-review";

describe("needsMbankReview", () => {
  it("true when mbank is bez kategorii", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Bez kategorii",
        categoryId: "c1",
        categoryName: "Żywność",
      }),
    ).toBe(true);
  });

  it("true when app category differs from mbank", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: "c1",
        categoryName: "Paliwo",
      }),
    ).toBe(true);
  });

  it("true when mbank has category but app has none", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: null,
        categoryName: null,
      }),
    ).toBe(true);
  });

  it("false when names match", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: "c1",
        categoryName: "Transport",
      }),
    ).toBe(false);
  });

  it("false when both empty mbank and no app category", () => {
    expect(
      needsMbankReview({
        mbankCategory: "",
        categoryId: null,
        categoryName: null,
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Uruchom test — FAIL**

Run: `npm test -- tests/lib/needs-mbank-review.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementacja**

```typescript
import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export interface MbankReviewInput {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}

export function needsMbankReview(input: MbankReviewInput): boolean {
  const normalizedMbank = normalizeMbankCategoryName(input.mbankCategory);

  if (!normalizedMbank) {
    return Boolean(input.mbankCategory.trim()) || input.categoryId !== null;
  }

  if (!input.categoryId) {
    return true;
  }

  if (!input.categoryName) {
    return true;
  }

  return input.categoryName.trim().toLowerCase() !== normalizedMbank.trim().toLowerCase();
}
```

- [ ] **Step 4: Uruchom test — PASS**

Run: `npm test -- tests/lib/needs-mbank-review.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/review/needs-mbank-review.ts tests/lib/needs-mbank-review.test.ts
git commit -m "feat: reguła kwalifikacji transakcji do kolejki review mBank"
```

---

### Task 8: Ładowanie kolejki review

**Files:**
- Create: `src/lib/review/build-review-queue-where.ts`
- Create: `src/lib/review/load-review-queue.ts`

- [ ] **Step 1: Filtr Prisma (OR warunków)**

```typescript
import type { Prisma } from "@prisma/client";

import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export function buildReviewQueueWhere(workspaceId: string): Prisma.TransactionWhereInput {
  return {
    workspaceId,
    OR: [
      { mbankCategory: { contains: "bez kategorii", mode: "insensitive" } },
      {
        AND: [
          { categoryId: { not: null } },
          { mbankCategory: { not: "" } },
          // różnica nazw — filtrowane w aplikacji po fetch (Prisma nie ma łatwego join compare)
        ],
      },
      {
        AND: [
          { categoryId: null },
          { NOT: { mbankCategory: { in: ["", "Bez kategorii", "bez kategorii"] } } },
        ],
      },
    ],
  };
}

export function isReviewRow(
  row: { mbankCategory: string; categoryId: string | null; categoryName: string | null },
): boolean {
  const normalized = normalizeMbankCategoryName(row.mbankCategory);
  if (row.mbankCategory.toLowerCase().includes("bez kategorii")) {
    return true;
  }
  if (normalized && !row.categoryId) {
    return true;
  }
  if (normalized && row.categoryName) {
    return row.categoryName.trim().toLowerCase() !== normalized.trim().toLowerCase();
  }
  return false;
}
```

- [ ] **Step 2: Loader strony**

```typescript
import { prisma } from "@/lib/db";
import { buildReviewQueueWhere, isReviewRow } from "@/lib/review/build-review-queue-where";

const REVIEW_PAGE_SIZE = 50;

export interface ReviewQueueItem {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: string;
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}

export async function loadReviewQueue(
  workspaceId: string,
  page = 1,
): Promise<{ items: ReviewQueueItem[]; total: number; page: number }> {
  const candidates = await prisma.transaction.findMany({
    where: buildReviewQueueWhere(workspaceId),
    include: { category: { select: { name: true } } },
    orderBy: { bookedAt: "desc" },
    take: 500,
  });

  const filtered = candidates
    .filter((tx) =>
      isReviewRow({
        mbankCategory: tx.mbankCategory,
        categoryId: tx.categoryId,
        categoryName: tx.category?.name ?? null,
      }),
    )
    .map((tx) => ({
      id: tx.id,
      bookedAt: tx.bookedAt,
      counterparty: tx.counterparty,
      description: tx.description,
      amount: tx.amount.toString(),
      currency: tx.currency,
      mbankCategory: tx.mbankCategory,
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
    }));

  const total = filtered.length;
  const start = (page - 1) * REVIEW_PAGE_SIZE;
  const items = filtered.slice(start, start + REVIEW_PAGE_SIZE);

  return { items, total, page };
}

export async function countReviewQueue(workspaceId: string): Promise<number> {
  const { total } = await loadReviewQueue(workspaceId, 1);
  return total;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/build-review-queue-where.ts src/lib/review/load-review-queue.ts
git commit -m "feat: ładowanie kolejki weryfikacji mBank"
```

---

### Task 9: AI — weryfikacja przypisań mBank

**Files:**
- Create: `src/lib/ai/prompts/mbank-verify.ts`
- Create: `src/lib/ai/verify-mbank-assignments.ts`
- Create: `src/lib/ai/run-mbank-verify-batch.ts`
- Test: `tests/lib/verify-mbank-assignments.test.ts`

- [ ] **Step 1: Test parse JSON**

```typescript
import { describe, expect, it } from "vitest";

import { parseMbankVerifyResponse } from "@/lib/ai/verify-mbank-assignments";

describe("parseMbankVerifyResponse", () => {
  it("parses valid suggestions", () => {
    const raw = JSON.stringify({
      suggestions: [
        {
          id: "tx-1",
          recommendedCategory: "Żywność i chemia domowa",
          reason: "Opis wskazuje zakupy spożywcze.",
          prefer: "app",
        },
      ],
    });
    const result = parseMbankVerifyResponse(raw, new Set(["Żywność i chemia domowa"]));
    expect(result.get("tx-1")).toEqual({
      recommendedCategory: "Żywność i chemia domowa",
      reason: "Opis wskazuje zakupy spożywcze.",
      prefer: "app",
    });
  });

  it("skips unknown categories", () => {
    const raw = JSON.stringify({
      suggestions: [{ id: "tx-1", recommendedCategory: "Nieistniejąca", reason: "x", prefer: "mbank" }],
    });
    const result = parseMbankVerifyResponse(raw, new Set(["Transport"]));
    expect(result.size).toBe(0);
  });
});
```

- [ ] **Step 2: Uruchom test — FAIL**

Run: `npm test -- tests/lib/verify-mbank-assignments.test.ts`
Expected: FAIL

- [ ] **Step 3: Prompt + parser + runner**

`src/lib/ai/prompts/mbank-verify.ts`:

```typescript
export function buildMbankVerifySystemPrompt(categoryNames: string[]): string {
  const list = categoryNames.map((name) => `- ${name}`).join("\n");
  return `<role>Weryfikujesz zgodność kategorii mBank z kategoriami aplikacji (PL, dom + JDG).</role>

<categories>
${list}
</categories>

<rules>
- Odpowiedź WYŁĄCZNIE JSON: {"suggestions":[{"id":"...","recommendedCategory":"...","reason":"...","prefer":"mbank"|"app"}]}
- "recommendedCategory" musi być z listy kategorii
- "reason" — jedno zdanie po polsku
- "prefer": "mbank" gdy kategoria banku jest sensowna; "app" gdy propozycja app jest lepsza
- Nie zmieniaj nic automatycznie — tylko sugestia
</rules>`;
}
```

`src/lib/ai/verify-mbank-assignments.ts`:

```typescript
import { z } from "zod";

import { buildMbankVerifySystemPrompt } from "@/lib/ai/prompts/mbank-verify";
import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import { logger } from "@/lib/logger";

export interface MbankVerifySuggestion {
  recommendedCategory: string;
  reason: string;
  prefer: "mbank" | "app";
}

const responseSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      recommendedCategory: z.string(),
      reason: z.string(),
      prefer: z.enum(["mbank", "app"]),
    }),
  ),
});

export function parseMbankVerifyResponse(
  raw: string,
  validCategoryNames: Set<string>,
): Map<string, MbankVerifySuggestion> {
  const jsonPattern = /\{[\s\S]*\}/;
  const jsonMatch = jsonPattern.exec(raw);
  if (!jsonMatch) {
    logger.error("ai.mbankVerify.parse", { context: { reason: "no_json" } });
    throw new Error("AI: brak JSON w odpowiedzi");
  }
  const parsed = responseSchema.parse(JSON.parse(jsonMatch[0]));
  const result = new Map<string, MbankVerifySuggestion>();
  for (const item of parsed.suggestions) {
    if (!validCategoryNames.has(item.recommendedCategory)) {
      continue;
    }
    result.set(item.id, {
      recommendedCategory: item.recommendedCategory,
      reason: item.reason,
      prefer: item.prefer,
    });
  }
  return result;
}

export interface TransactionForMbankVerify {
  id: string;
  description: string;
  counterparty: string;
  amount: string;
  mbankCategory: string;
  appCategoryName: string | null;
}

export async function verifyMbankAssignmentsWithAi(options: {
  config: AiConfig;
  transactions: TransactionForMbankVerify[];
  categoryNames: string[];
  fetchFn?: FetchFn;
}): Promise<Map<string, MbankVerifySuggestion>> {
  const rows = options.transactions.map((tx) => ({
    id: tx.id,
    kontrahent: tx.counterparty,
    opis: tx.description.slice(0, 120),
    kwota: tx.amount,
    kategoria_mbank: tx.mbankCategory,
    kategoria_app: tx.appCategoryName,
  }));
  const raw = await completeWithAi(
    options.config,
    {
      system: buildMbankVerifySystemPrompt(options.categoryNames),
      user: `Zweryfikuj przypisania:\n${JSON.stringify(rows)}`,
      maxTokens: 4096,
    },
    options.fetchFn,
  );
  return parseMbankVerifyResponse(raw, new Set(options.categoryNames));
}
```

`src/lib/ai/run-mbank-verify-batch.ts`:

```typescript
import { verifyMbankAssignmentsWithAi } from "@/lib/ai/verify-mbank-assignments";
import type { AiConfig } from "@/lib/ai/config";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

export const MBANK_VERIFY_BATCH_SIZE = 50;

export async function runMbankVerifyBatch(options: {
  config: AiConfig;
  items: ReviewQueueItem[];
  categoryNames: string[];
}): Promise<Map<string, import("@/lib/ai/verify-mbank-assignments").MbankVerifySuggestion>> {
  const batch = options.items.slice(0, MBANK_VERIFY_BATCH_SIZE);
  return verifyMbankAssignmentsWithAi({
    config: options.config,
    categoryNames: options.categoryNames,
    transactions: batch.map((item) => ({
      id: item.id,
      description: item.description,
      counterparty: item.counterparty,
      amount: item.amount,
      mbankCategory: item.mbankCategory,
      appCategoryName: item.categoryName,
    })),
  });
}
```

- [ ] **Step 4: Uruchom test — PASS**

Run: `npm test -- tests/lib/verify-mbank-assignments.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts/mbank-verify.ts src/lib/ai/verify-mbank-assignments.ts src/lib/ai/run-mbank-verify-batch.ts tests/lib/verify-mbank-assignments.test.ts
git commit -m "feat: AI weryfikacja rozbieżności kategorii mBank"
```

---

### Task 10: Server actions review

**Files:**
- Create: `src/server/actions/review.ts`

- [ ] **Step 1: Implementacja**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAiConfigForWorkspace } from "@/lib/ai/resolve-workspace-ai";
import { runMbankVerifyBatch } from "@/lib/ai/run-mbank-verify-batch";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";
import { countReviewQueue, loadReviewQueue } from "@/lib/review/load-review-queue";

export type ReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type AiVerifyBatchResult =
  | {
      ok: true;
      suggestions: Record<string, MbankVerifySuggestion>;
    }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const decisionSchema = z.object({
  transactionId: z.string().min(1),
  decision: z.enum(["mbank", "app", "custom", "skip"]),
  categoryId: z.string().optional(),
});

export async function getReviewQueueCount(): Promise<number> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return 0;
  }
  return countReviewQueue(workspaceId);
}

export async function aiVerifyReviewBatch(page = 1): Promise<AiVerifyBatchResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const config = await getAiConfigForWorkspace(workspaceId);
  if (!config) {
    return {
      ok: false,
      error: "Brak klucza API. Ustaw ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env",
    };
  }

  try {
    const { items } = await loadReviewQueue(workspaceId, page);
    if (items.length === 0) {
      return { ok: false, error: "Kolejka weryfikacji jest pusta" };
    }

    const categories = await prisma.category.findMany({ where: { workspaceId } });
    const suggestions = await runMbankVerifyBatch({
      config,
      items,
      categoryNames: categories.map((c) => c.name),
    });

    const record: Record<string, MbankVerifySuggestion> = {};
    for (const [id, suggestion] of suggestions) {
      record[id] = suggestion;
    }

    return { ok: true, suggestions: record };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("review.aiVerifyBatch", error, { context: { workspaceId } }),
    };
  }
}

export async function applyReviewDecision(input: {
  transactionId: string;
  decision: "mbank" | "app" | "custom" | "skip";
  categoryId?: string;
}): Promise<ReviewActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  if (parsed.data.decision === "skip") {
    return { ok: true, message: "Pominięto" };
  }

  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: parsed.data.transactionId, workspaceId },
      include: { category: { select: { name: true } } },
    });
    if (!tx) {
      return { ok: false, error: "Nie znaleziono transakcji" };
    }

    let targetCategoryId: string | null = null;

    if (parsed.data.decision === "mbank") {
      const mbankName = normalizeMbankCategoryName(tx.mbankCategory);
      if (!mbankName) {
        return { ok: false, error: "mBank nie ma sensownej kategorii" };
      }
      const category = await prisma.category.findFirst({
        where: { workspaceId, name: mbankName },
      });
      if (!category) {
        return { ok: false, error: `Brak kategorii «${mbankName}» w app` };
      }
      targetCategoryId = category.id;
    } else if (parsed.data.decision === "app") {
      targetCategoryId = tx.categoryId;
      if (!targetCategoryId) {
        return { ok: false, error: "Brak kategorii app do zaakceptowania" };
      }
    } else if (parsed.data.decision === "custom") {
      if (!parsed.data.categoryId) {
        return { ok: false, error: "Wybierz kategorię" };
      }
      const category = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, workspaceId },
      });
      if (!category) {
        return { ok: false, error: "Nieprawidłowa kategoria" };
      }
      targetCategoryId = category.id;
    }

    await prisma.transaction.updateMany({
      where: { id: tx.id, workspaceId },
      data: { categoryId: targetCategoryId },
    });

    revalidatePath("/review");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { ok: true, message: "Zapisano decyzję" };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("review.applyDecision", error, {
        context: { workspaceId, transactionId: parsed.data.transactionId },
      }),
    };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/review.ts
git commit -m "feat: server actions kolejki weryfikacji mBank"
```

---

### Task 11: UI strony `/review`

**Files:**
- Create: `src/components/review/ReviewQueueTable.tsx`
- Create: `src/components/review/ReviewAiBatchButton.tsx`
- Create: `src/app/(app)/review/page.tsx`
- Modify: `src/components/AppNavLinks.tsx`

- [ ] **Step 1: Przycisk AI batch (client)**

```tsx
"use client";

import { useState, useTransition } from "react";

import { aiVerifyReviewBatch } from "@/server/actions/review";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";

export function ReviewAiBatchButton({
  page,
  onSuggestions,
}: {
  page: number;
  onSuggestions: (suggestions: Record<string, MbankVerifySuggestion>) => void;
}): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(): void {
    setError(null);
    startTransition(async () => {
      const result = await aiVerifyReviewBatch(page);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuggestions(result.suggestions);
    });
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={run} disabled={pending} className="btn-primary text-sm">
        {pending ? "Weryfikuję…" : "Zweryfikuj 50 z AI"}
      </button>
      {error ? <p className="alert-error text-sm">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Tabela review (client) z akcjami**

`ReviewQueueTable.tsx` — kolumny: data, kontrahent, mBank, app, sugestia AI (reason), przyciski:
- „Zaakceptuj mBank” → `applyReviewDecision({ decision: "mbank" })`
- „Zaakceptuj app” → `applyReviewDecision({ decision: "app" })`
- `<select>` + „Inna” → `applyReviewDecision({ decision: "custom", categoryId })`
- „Pomiń” → `applyReviewDecision({ decision: "skip" })`

Użyj `useTransition` + `router.refresh()` po sukcesie.

- [ ] **Step 3: Strona review**

```tsx
import { redirect } from "next/navigation";

import { ReviewPageClient } from "@/components/review/ReviewPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { auth } from "@/lib/auth";
import { loadReviewQueue } from "@/lib/review/load-review-queue";
import { prisma } from "@/lib/db";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const workspaceId = session.user.workspaceId;

  const [queue, categories] = await Promise.all([
    loadReviewQueue(workspaceId, page),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weryfikacja mBank"
        lead="Porównaj kategorie banku z aplikacją. AI podpowiada — Ty decydujesz."
        tip="Pozycje z «Bez kategorii» mBank, rozbieżności nazw lub brak kategorii app mimo danych banku."
      />
      <ReviewPageClient
        items={queue.items}
        total={queue.total}
        page={queue.page}
        categories={categories}
      />
    </div>
  );
}
```

Utwórz `ReviewPageClient.tsx` łączący `ReviewAiBatchButton` + `ReviewQueueTable` ze stanem sugestii.

- [ ] **Step 4: Nav link**

W `AppNavLinks.tsx` dodaj po „Transakcje”:

```typescript
  {
    href: "/review",
    label: "Weryfikacja",
    tip: "Kolejka rozbieżności kategorii mBank vs aplikacja.",
  },
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/review/page.tsx src/components/review/ReviewQueueTable.tsx src/components/review/ReviewAiBatchButton.tsx src/components/review/ReviewPageClient.tsx src/components/AppNavLinks.tsx
git commit -m "feat: strona weryfikacji mBank z akcjami i AI batch"
```

---

### Task 12: Baner review na dashboardzie

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Pobierz count i pokaż baner**

W loaderze dashboardu (lub bezpośrednio w page) dodaj:

```typescript
import { countReviewQueue } from "@/lib/review/load-review-queue";

// w page.tsx po załadowaniu danych:
const reviewCount = await countReviewQueue(session.user.workspaceId);
```

Pod banerem uncategorized dodaj:

```tsx
      {reviewCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {reviewCount} transakcji do weryfikacji mBank —{" "}
          <a href="/review" className="link-brand font-medium">
            przejdź do kolejki
          </a>
        </p>
      ) : null}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: baner kolejki weryfikacji mBank na dashboardzie"
```

---

### Task 13: Smoke E2E i pełna weryfikacja

**Files:**
- Create: `tests/e2e/review-smoke.spec.ts`

- [ ] **Step 1: Smoke test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("review page smoke", () => {
  test("authenticated user sees review page", async ({ page }) => {
    await page.goto("/review");
    await expect(page.getByRole("heading", { name: "Weryfikacja mBank" })).toBeVisible();
  });
});
```

- [ ] **Step 2: Pełny check**

Run: `npm run check`
Expected: PASS (format, lint, typecheck, coverage)

- [ ] **Step 3: Smoke E2E (jeśli demo seed + auth setup działają lokalnie)**

Run: `npm run test:smoke`
Expected: PASS including new review spec

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/review-smoke.spec.ts
git commit -m "test: smoke E2E strony weryfikacji mBank"
```

---

## Self-review (spec → plan)

**1. Spec coverage**

| Wymaganie roadmap §1.2 (bulk) | Task |
| ----------------------------- | ---- |
| Filtr kontrahent / mBank / brak kategorii / daty / kontekst | Task 2, 5, 6 |
| Podgląd N transakcji | Task 4 (`previewBulkCategoryUpdate`) |
| Wybór kategorii + zapamiętaj kontrahenta | Task 3, 4, 6 |
| Zaznaczone ID (checkboxy) | Task 6 |
| `bulkUpdateCategory`, max 500, workspaceId | Task 2–4 |
| Akceptacja: LIDL 40 tx w 2 kliknięcia | Task 6 (filtr kontrahent + podgląd + apply) |

| Wymaganie roadmap §1.4 (review) | Task |
| ------------------------------- | ---- |
| Kolejka: bez kategorii mBank / mismatch / brak app | Task 7, 8 |
| AI sugeruje, nie zmienia od razu | Task 9, 10, 11 |
| Akcje: mBank / app / inna / pomiń | Task 10, 11 |
| Batch 50 z AI | Task 9, 11 |
| Pliki verify-mbank-assignments + review actions | Task 9, 10 |

**2. Placeholder scan:** Brak TBD / „implement later” / pustych kroków testowych.

**3. Type consistency:** `BulkCategoryFilters`, `MbankVerifySuggestion`, `ReviewQueueItem` używane spójnie między lib → actions → UI.

**Luka świadoma (YAGNI):** Decyzja „skip” nie zapisuje się w DB — pozycja wróci po odświeżeniu. Akceptowalne w v1.1; opcjonalna migracja `ReviewSkip` poza scope tego planu.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-24-v11-bulk-and-review.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
