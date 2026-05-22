# MVP Analiza wyciągów — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dostarczyć webową aplikację (para + JDG), która importuje CSV z mBanku, kategoryzuje transakcje i pokazuje strukturę wydatków (firma / dom / razem) na wykresach kategorii i top merchantów.

**Architecture:** Monolit Next.js 15 (App Router) z Server Actions, PostgreSQL + Prisma, Auth.js (credentials). Logika domenowa w `src/lib/` (parser, hash duplikatów, kategoryzacja, analityka) z testami Vitest. UI po polsku, mobile-friendly.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Auth.js v5, bcryptjs, Recharts, Vitest, Playwright, ESLint strict, Prettier, Husky

**Spec:** `docs/superpowers/specs/2026-05-21-analiza-wyciagow-design.md`  
**Testy:** `docs/testing-strategy.md` | **Reguły kodu:** `.cursor/rules/code-readability.mdc`, `.cursor/rules/testing.mdc`

### Jakość (obowiązkowe przy każdym tasku)

- `npm run test:watch` podczas pracy nad `src/lib/`
- `npm run test:changed` przed commitem
- `npm run check` przed PR (format + lint + typecheck + coverage)
- Progi: `src/lib/**` ≥95% lines; każda nowa funkcja = test najpierw (TDD)

### Format mBank (Lista operacji — prawdziwy zrzut)

Nagłówek w pliku (po preamble): `#Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;`  
Implementacja: `src/lib/mbank-csv.ts`, `src/lib/extract-merchant.ts`, fixture `tests/fixtures/mbank-sample.csv`

---

## Mapa plików (odpowiedzialności)

| Ścieżka                                     | Odpowiedzialność                                     |
| ------------------------------------------- | ---------------------------------------------------- |
| `prisma/schema.prisma`                      | Model danych                                         |
| `src/lib/db.ts`                             | Singleton Prisma                                     |
| `src/lib/auth.ts`                           | Konfiguracja Auth.js                                 |
| `src/lib/transaction-hash.ts`               | Hash duplikatów                                      |
| `src/lib/mbank-csv.ts`                      | Parser „Lista operacji” mBank                        |
| `src/lib/extract-merchant.ts`               | Kontrahent z opisu operacji                          |
| `eslint.config.mjs`                         | Reguły strict (complexity, max-lines)                |
| `.cursor/rules/*.mdc`                       | Reguły AI: czytelność + testy                        |
| `src/lib/categorization/apply-rules.ts`     | Reguły tekstowe                                      |
| `src/lib/categorization/merchant-memory.ts` | Pamięć kontrahenta                                   |
| `src/lib/analytics/category-breakdown.ts`   | Wykres A                                             |
| `src/lib/analytics/top-merchants.ts`        | Wykres B                                             |
| `src/lib/analytics/filters.ts`              | Filtr firma/dom/razem + daty                         |
| `src/server/actions/import.ts`              | Upload + zapis transakcji                            |
| `src/server/actions/transactions.ts`        | Lista, zmiana kategorii                              |
| `src/server/actions/categories.ts`          | CRUD kategorii i reguł                               |
| `src/server/actions/workspace.ts`           | Konta, zaproszenia, eksport/usuń                     |
| `src/app/(auth)/*`                          | Login, rejestracja                                   |
| `src/app/(app)/*`                           | Dashboard, transakcje, import, kategorie, ustawienia |
| `tests/fixtures/mbank-sample.csv`           | Przykładowy eksport (anonimizowany)                  |
| `tests/lib/*.test.ts`                       | Testy jednostkowe domeny                             |

---

## Task 1: Inicjalizacja repozytorium i Next.js

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`
- Create: `README.md`

- [ ] **Step 1: Zainicjuj git i Next.js**

```bash
cd /Users/adammichalczyk/projects/analiza_wyciagow
git init
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

Gdy installer pyta o nadpisanie — potwierdź tylko puste katalogi; `docs/` zostaw.

- [ ] **Step 2: Dodaj zależności**

```bash
npm install @prisma/client bcryptjs zod
npm install -D prisma vitest @vitejs/plugin-react @testing-library/react jsdom
npm install next-auth@beta @auth/prisma-adapter
npm install recharts date-fns
```

- [ ] **Step 3: Skonfiguruj Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Utwórz `.env.example`**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/analiza_wyciagow"
AUTH_SECRET="wygeneruj: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Skopiuj do `.env` lokalnie (nie commituj `.env`).

- [ ] **Step 5: Uruchom dev server**

```bash
npm run dev
```

Expected: aplikacja na http://localhost:3000

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js project with test tooling"
```

---

## Task 2: Schema Prisma i migracja

**Files:**

- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Napisz schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String            @id @default(cuid())
  email         String            @unique
  passwordHash  String
  name          String?
  createdAt     DateTime          @default(now())
  memberships   WorkspaceMember[]
}

model Workspace {
  id           String            @id @default(cuid())
  name         String            @default("Nasze finanse")
  inviteCode   String            @unique @default(cuid())
  createdAt    DateTime          @default(now())
  members      WorkspaceMember[]
  accounts     Account[]
  categories   Category[]
  rules        CategoryRule[]
  transactions Transaction[]
  importBatches ImportBatch[]
  merchantMemories MerchantCategoryMemory[]
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        String    @default("member")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@unique([userId, workspaceId])
}

enum AccountType {
  firma
  dom
}

model Account {
  id           String        @id @default(cuid())
  workspaceId  String
  type         AccountType
  name         String
  createdAt    DateTime      @default(now())
  workspace    Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  transactions Transaction[]
}

model Category {
  id           String        @id @default(cuid())
  workspaceId  String
  name         String
  color        String        @default("#6366f1")
  isDefault    Boolean       @default(false)
  workspace    Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  rules        CategoryRule[]
  merchantMemories MerchantCategoryMemory[]
  @@unique([workspaceId, name])
}

model CategoryRule {
  id           String    @id @default(cuid())
  workspaceId  String
  categoryId   String
  matchField   String    // "description" | "counterparty"
  matchContains String
  priority     Int       @default(0)
  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  category     Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
}

model MerchantCategoryMemory {
  id           String    @id @default(cuid())
  workspaceId  String
  counterparty String
  categoryId   String
  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  category     Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@unique([workspaceId, counterparty])
}

model ImportBatch {
  id           String        @id @default(cuid())
  workspaceId  String
  accountId    String
  fileName     String
  importedAt   DateTime      @default(now())
  newCount     Int
  skippedCount Int
  workspace    Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  transactions Transaction[]
}

model Transaction {
  id              String       @id @default(cuid())
  workspaceId     String
  accountId       String
  importBatchId   String?
  dedupeHash      String
  bookedAt        DateTime
  amount          Decimal      @db.Decimal(12, 2)
  currency        String       @default("PLN")
  description     String
  counterparty    String       @default("")
  categoryId      String?
  workspace       Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  account         Account      @relation(fields: [accountId], references: [id], onDelete: Cascade)
  importBatch     ImportBatch? @relation(fields: [importBatchId], references: [id])
  category        Category?    @relation(fields: [categoryId], references: [id])
  @@unique([workspaceId, dedupeHash])
  @@index([workspaceId, bookedAt])
  @@index([workspaceId, categoryId])
}
```

- [ ] **Step 2: Utwórz `src/lib/db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Migracja**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Expected: migracja OK, `node_modules/.prisma/client` wygenerowany

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema and database client"
```

---

## Task 3: Hash duplikatów transakcji

**Files:**

- Create: `src/lib/transaction-hash.ts`
- Create: `tests/lib/transaction-hash.test.ts`

- [ ] **Step 1: Napisz test**

Create `tests/lib/transaction-hash.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildTransactionDedupeHash } from "@/lib/transaction-hash";

describe("buildTransactionDedupeHash", () => {
  it("returns stable hash for same inputs", () => {
    const input = {
      bookedAt: new Date("2025-03-01"),
      amount: "-49.99",
      description: "Zakup BLIK",
      accountId: "acc_1",
    };
    expect(buildTransactionDedupeHash(input)).toBe(buildTransactionDedupeHash(input));
  });

  it("differs when amount changes", () => {
    const base = {
      bookedAt: new Date("2025-03-01"),
      amount: "-49.99",
      description: "Zakup BLIK",
      accountId: "acc_1",
    };
    const a = buildTransactionDedupeHash(base);
    const b = buildTransactionDedupeHash({ ...base, amount: "-50.00" });
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Uruchom test — oczekiwany FAIL**

```bash
npm test -- tests/lib/transaction-hash.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implementacja**

Create `src/lib/transaction-hash.ts`:

```typescript
import { createHash } from "crypto";

export type DedupeInput = {
  bookedAt: Date;
  amount: string;
  description: string;
  accountId: string;
};

export function buildTransactionDedupeHash(input: DedupeInput): string {
  const day = input.bookedAt.toISOString().slice(0, 10);
  const payload = [day, input.amount, input.description.trim(), input.accountId].join(
    "|",
  );
  return createHash("sha256").update(payload).digest("hex");
}
```

- [ ] **Step 4: Uruchom test — PASS**

```bash
npm test -- tests/lib/transaction-hash.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/transaction-hash.ts tests/lib/transaction-hash.test.ts
git commit -m "feat: add transaction deduplication hash"
```

---

## Task 4: Parser CSV mBank

**Format mBank (MVP):** UTF-8, separator `;`, linia 1 = IBAN, linia 2 = nagłówki, kolumny: Data operacji, Data księgowania, Opis operacji, Tytuł, Nadawca/Odbiorca, Numer konta, Kwota, Saldo po operacji. Kwota: przecinek dziesiętny, minus = wydatek.

**Files:**

- Create: `tests/fixtures/mbank-sample.csv`
- Create: `src/lib/mbank-csv.ts`
- Create: `tests/lib/mbank-csv.test.ts`

- [ ] **Step 1: Fixture**

Create `tests/fixtures/mbank-sample.csv`:

```csv
PL61114020040000300276355437
#Data operacji;#Data księgowania;#Opis operacji;#Tytuł;#Nadawca/Odbiorca;#Numer konta;#Kwota;#Saldo po operacji;
2025-01-15;2025-01-15;Zakup BLIK;Biedronka;BIEDRONKA SP. Z O.O.;';-89,50;1000,00
2025-01-16;2025-01-16;Przelew przychodzący;Faktura 01/2025;KLIENT ABC;';1500,00;2500,00
```

(Uwaga: dokładne nagłówki mogą różnić się o `#` — parser normalizuje.)

- [ ] **Step 2: Test**

Create `tests/lib/mbank-csv.test.ts`:

```typescript
import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { parseMbankCsv } from "@/lib/mbank-csv";

describe("parseMbankCsv", () => {
  it("parses sample export rows", () => {
    const raw = readFileSync(
      join(process.cwd(), "tests/fixtures/mbank-sample.csv"),
      "utf-8",
    );
    const rows = parseMbankCsv(raw);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      bookedAt: new Date("2025-01-15"),
      amount: "-89.50",
      description: expect.stringContaining("Biedronka"),
      counterparty: expect.stringContaining("BIEDRONKA"),
    });
    expect(rows[1].amount).toBe("1500.00");
  });

  it("throws on empty file", () => {
    expect(() => parseMbankCsv("")).toThrow("Pusty plik CSV");
  });
});
```

- [ ] **Step 3: FAIL**

```bash
npm test -- tests/lib/mbank-csv.test.ts
```

- [ ] **Step 4: Implementacja**

Create `src/lib/mbank-csv.ts`:

```typescript
export type ParsedMbankRow = {
  bookedAt: Date;
  amount: string;
  description: string;
  counterparty: string;
};

function normalizeHeader(h: string): string {
  return h.replace(/^#/, "").trim().toLowerCase();
}

function parsePolishAmount(raw: string): string {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (Number.isNaN(n)) throw new Error(`Nieprawidłowa kwota: ${raw}`);
  return n.toFixed(2);
}

function findColumnIndex(headers: string[], name: string): number {
  const idx = headers.findIndex((h) => normalizeHeader(h) === name.toLowerCase());
  if (idx === -1) throw new Error(`Brak kolumny: ${name}`);
  return idx;
}

export function parseMbankCsv(content: string): ParsedMbankRow[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Pusty plik CSV");

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 3)
    throw new Error("Plik CSV ma za mało linii (oczekiwano IBAN, nagłówki, dane)");

  const headerLine = lines[1];
  const headers = headerLine.split(";").map(normalizeHeader);
  const idxDate = findColumnIndex(headers, "data operacji");
  const idxTitle = findColumnIndex(headers, "tytuł");
  const idxDesc = findColumnIndex(headers, "opis operacji");
  const idxParty = findColumnIndex(headers, "nadawca/odbiorca");
  const idxAmount = findColumnIndex(headers, "kwota");

  const rows: ParsedMbankRow[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < headers.length) continue;
    const title = cols[idxTitle]?.trim() ?? "";
    const opis = cols[idxDesc]?.trim() ?? "";
    const description = [opis, title].filter(Boolean).join(" — ") || "Bez opisu";
    rows.push({
      bookedAt: new Date(cols[idxDate].trim()),
      amount: parsePolishAmount(cols[idxAmount]),
      description,
      counterparty: cols[idxParty]?.trim() ?? "",
    });
  }
  return rows;
}
```

- [ ] **Step 5: PASS i ewentualna korekta nagłówków fixture**

```bash
npm test -- tests/lib/mbank-csv.test.ts
```

Jeśli FAIL na nagłówkach — dopasuj fixture do rzeczywistego eksportu z Waszego mBank (pierwszy prawdziwy plik trafia do `tests/fixtures/mbank-real-anonymized.csv`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/mbank-csv.ts tests/
git commit -m "feat: parse mBank CSV exports"
```

---

## Task 5: Silnik kategoryzacji

**Files:**

- Create: `src/lib/categorization/apply-rules.ts`
- Create: `src/lib/categorization/merchant-memory.ts`
- Create: `src/lib/categorization/categorize-transaction.ts`
- Create: `tests/lib/categorization.test.ts`

- [ ] **Step 1: Test reguł**

Create `tests/lib/categorization.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { matchCategoryRule } from "@/lib/categorization/apply-rules";

describe("matchCategoryRule", () => {
  const rules = [
    {
      id: "1",
      categoryId: "cat-food",
      matchField: "counterparty",
      matchContains: "BIEDRONKA",
      priority: 10,
    },
    {
      id: "2",
      categoryId: "cat-other",
      matchField: "description",
      matchContains: "ZUS",
      priority: 5,
    },
  ];

  it("matches highest priority rule on counterparty", () => {
    const cat = matchCategoryRule(
      { description: "Zakup", counterparty: "BIEDRONKA SP." },
      rules,
    );
    expect(cat).toBe("cat-food");
  });
});
```

- [ ] **Step 2: FAIL → implement `apply-rules.ts`**

```typescript
export type CategoryRuleInput = {
  id: string;
  categoryId: string;
  matchField: string;
  matchContains: string;
  priority: number;
};

export function matchCategoryRule(
  tx: { description: string; counterparty: string },
  rules: CategoryRuleInput[],
): string | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    const hay = rule.matchField === "counterparty" ? tx.counterparty : tx.description;
    if (hay.toLowerCase().includes(rule.matchContains.toLowerCase())) {
      return rule.categoryId;
    }
  }
  return null;
}
```

- [ ] **Step 3: `merchant-memory.ts` + `categorize-transaction.ts`**

```typescript
// merchant-memory.ts
export function resolveMerchantCategory(
  counterparty: string,
  memories: { counterparty: string; categoryId: string }[],
): string | null {
  const key = counterparty.trim().toLowerCase();
  const hit = memories.find((m) => m.counterparty.trim().toLowerCase() === key);
  return hit?.categoryId ?? null;
}
```

```typescript
// categorize-transaction.ts
import { matchCategoryRule, CategoryRuleInput } from "./apply-rules";
import { resolveMerchantCategory } from "./merchant-memory";

export function categorizeTransaction(
  tx: { description: string; counterparty: string },
  rules: CategoryRuleInput[],
  memories: { counterparty: string; categoryId: string }[],
): string | null {
  return (
    matchCategoryRule(tx, rules) ??
    resolveMerchantCategory(tx.counterparty, memories) ??
    null
  );
}
```

- [ ] **Step 4: PASS**

```bash
npm test -- tests/lib/categorization.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/categorization/ tests/lib/categorization.test.ts
git commit -m "feat: add categorization rules and merchant memory"
```

---

## Task 6: Analityka (dashboard A + B)

**Files:**

- Create: `src/lib/analytics/filters.ts`
- Create: `src/lib/analytics/category-breakdown.ts`
- Create: `src/lib/analytics/top-merchants.ts`
- Create: `tests/lib/analytics.test.ts`

- [ ] **Step 1: Filtry kont**

Create `src/lib/analytics/filters.ts`:

```typescript
export type ContextFilter = "firma" | "dom" | "razem";

export function accountIdsForContext(
  accounts: { id: string; type: string }[],
  context: ContextFilter,
): string[] {
  if (context === "razem") return accounts.map((a) => a.id);
  return accounts.filter((a) => a.type === context).map((a) => a.id);
}
```

- [ ] **Step 2: Test i implementacja category-breakdown**

Create `tests/lib/analytics.test.ts` z transakcjami mock — sprawdź sumy per kategoria i tylko wydatki (amount < 0).

Create `src/lib/analytics/category-breakdown.ts`:

```typescript
export type TxForAnalytics = {
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  bookedAt: Date;
};

export type CategorySlice = {
  categoryId: string | null;
  categoryName: string;
  total: number;
  percent: number;
};

export function categoryBreakdown(transactions: TxForAnalytics[]): CategorySlice[] {
  const expenses = transactions.filter((t) => Number(t.amount) < 0);
  const byCat = new Map<string, { name: string; total: number }>();
  for (const t of expenses) {
    const key = t.categoryId ?? "__none__";
    const name = t.categoryName ?? "Bez kategorii";
    const prev = byCat.get(key) ?? { name, total: 0 };
    prev.total += Math.abs(Number(t.amount));
    byCat.set(key, prev);
  }
  const sum = [...byCat.values()].reduce((s, v) => s + v.total, 0) || 1;
  return [...byCat.entries()]
    .map(([categoryId, v]) => ({
      categoryId: categoryId === "__none__" ? null : categoryId,
      categoryName: v.name,
      total: Math.round(v.total * 100) / 100,
      percent: Math.round((v.total / sum) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 3: top-merchants**

Create `src/lib/analytics/top-merchants.ts`:

```typescript
export type MerchantRow = {
  counterparty: string;
  total: number;
  count: number;
  changePercent: number | null;
};

export function topMerchants(
  current: { counterparty: string; amount: string }[],
  previous: { counterparty: string; amount: string }[],
  limit = 15,
): MerchantRow[] {
  const sumBy = (rows: typeof current) => {
    const m = new Map<string, { total: number; count: number }>();
    for (const r of rows) {
      if (Number(r.amount) >= 0) continue;
      const key = r.counterparty.trim() || "Nieznany";
      const prev = m.get(key) ?? { total: 0, count: 0 };
      prev.total += Math.abs(Number(r.amount));
      prev.count += 1;
      m.set(key, prev);
    }
    return m;
  };
  const cur = sumBy(current);
  const prev = sumBy(previous);
  return [...cur.entries()]
    .map(([counterparty, v]) => {
      const p = prev.get(counterparty)?.total ?? 0;
      const changePercent = p === 0 ? null : Math.round(((v.total - p) / p) * 1000) / 10;
      return { counterparty, total: v.total, count: v.count, changePercent };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
```

- [ ] **Step 4: PASS**

```bash
npm test -- tests/lib/analytics.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/ tests/lib/analytics.test.ts
git commit -m "feat: add category and merchant analytics"
```

---

## Task 7: Auth.js — rejestracja, login, workspace

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/seed-default-categories.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/server/actions/auth.ts`

- [ ] **Step 1: Domyślne kategorie**

Create `src/lib/seed-default-categories.ts`:

```typescript
export const DEFAULT_CATEGORIES = [
  { name: "Żywność", color: "#22c55e" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Mieszkanie", color: "#a855f7" },
  { name: "Rozrywka", color: "#f97316" },
  { name: "Zdrowie", color: "#ec4899" },
  { name: "KUP (firma)", color: "#64748b" },
  { name: "ZUS (firma)", color: "#475569" },
  { name: "Przychód", color: "#10b981" },
  { name: "Inne", color: "#94a3b8" },
];

export async function seedCategoriesForWorkspace(
  workspaceId: string,
  prisma: import("@prisma/client").PrismaClient,
) {
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.create({
      data: { workspaceId, name: c.name, color: c.color, isDefault: true },
    });
  }
}
```

- [ ] **Step 2: Auth config (Credentials)**

Create `src/lib/auth.ts` z `NextAuth`, `Credentials` provider, `PrismaAdapter`, callbacks `session` z `workspaceId` (pierwszy workspace usera).

Create `src/server/actions/auth.ts`:

- `registerUser({ email, password, name, inviteCode? })` — jeśli `inviteCode`: dołącz do workspace; inaczej utwórz workspace + seed kategorii + 2 konta (`Konto firmowe`, `Konto domowe`).
- Hasło: `bcrypt.hash(password, 12)`.

- [ ] **Step 3: Strony login/register (PL)**

Proste formularze z `use server` actions, komunikaty błędów po polsku.

Register: pole opcjonalne „Kod zaproszenia”.

- [ ] **Step 4: Middleware ochrony**

Create `src/middleware.ts` — chronione `(app)` routes, redirect na `/login`.

- [ ] **Step 5: Ręczny smoke test**

```bash
npm run dev
```

Zarejestruj użytkownika → sprawdź w Prisma Studio:

```bash
npx prisma studio
```

Expected: User, Workspace, WorkspaceMember, 9 Category, 2 Account

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/ src/server/actions/auth.ts src/middleware.ts
git commit -m "feat: add auth, registration, and workspace bootstrap"
```

---

## Task 8: Server Action — import CSV

**Files:**

- Create: `src/server/actions/import.ts`
- Modify: `src/app/(app)/import/page.tsx`

- [ ] **Step 1: `importCsv` action**

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseMbankCsv } from "@/lib/mbank-csv";
import { buildTransactionDedupeHash } from "@/lib/transaction-hash";
import { categorizeTransaction } from "@/lib/categorization/categorize-transaction";

export async function importCsv(formData: FormData) {
  const session = await auth();
  if (!session?.user?.workspaceId) throw new Error("Brak sesji");

  const accountId = String(formData.get("accountId"));
  const file = formData.get("file") as File;
  const text = await file.text();

  const workspaceId = session.user.workspaceId;
  const [rules, memories] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId } }),
  ]);

  const rows = parseMbankCsv(text);
  let newCount = 0;
  let skippedCount = 0;

  const batch = await prisma.importBatch.create({
    data: {
      workspaceId,
      accountId,
      fileName: file.name,
      newCount: 0,
      skippedCount: 0,
    },
  });

  for (const row of rows) {
    const dedupeHash = buildTransactionDedupeHash({
      bookedAt: row.bookedAt,
      amount: row.amount,
      description: row.description,
      accountId,
    });
    const exists = await prisma.transaction.findUnique({
      where: { workspaceId_dedupeHash: { workspaceId, dedupeHash } },
    });
    if (exists) {
      skippedCount++;
      continue;
    }
    const categoryId = categorizeTransaction(row, rules, memories);
    await prisma.transaction.create({
      data: {
        workspaceId,
        accountId,
        importBatchId: batch.id,
        dedupeHash,
        bookedAt: row.bookedAt,
        amount: row.amount,
        description: row.description,
        counterparty: row.counterparty,
        categoryId,
      },
    });
    newCount++;
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { newCount, skippedCount },
  });

  return { newCount, skippedCount };
}
```

- [ ] **Step 2: Strona importu**

Formularz: select konta (firma/dom), input file `.csv`, submit → toast/komunikat „Zaimportowano X, pominięto Y duplikatów”.

- [ ] **Step 3: Test ręczny z fixture**

Upload `tests/fixtures/mbank-sample.csv` — sprawdź 2 transakcje w DB.

- [ ] **Step 4: Commit**

```bash
git add src/server/actions/import.ts src/app/(app)/import/
git commit -m "feat: import mBank CSV with deduplication and auto-categorization"
```

---

## Task 9: Transakcje — lista i zmiana kategorii + pamięć merchant

**Files:**

- Create: `src/server/actions/transactions.ts`
- Create: `src/app/(app)/transactions/page.tsx`
- Create: `src/components/transactions/TransactionTable.tsx`

- [ ] **Step 1: `updateTransactionCategory`**

Po zmianie kategorii:

1. Update `transaction.categoryId`
2. Upsert `MerchantCategoryMemory` dla `counterparty` (jeśli niepusty)

```typescript
await prisma.merchantCategoryMemory.upsert({
  where: {
    workspaceId_counterparty: {
      workspaceId,
      counterparty: tx.counterparty,
    },
  },
  create: { workspaceId, counterparty: tx.counterparty, categoryId },
  update: { categoryId },
});
```

Opcjonalnie: `applyCategoryToSimilarUncategorized` — transakcje z tym samym counterparty bez kategorii w tym workspace.

- [ ] **Step 2: Lista z filtrami**

Query params: `context=firma|dom|razem`, `from`, `to`, `uncategorized=1`.

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/transactions.ts src/app/(app)/transactions/ src/components/transactions/
git commit -m "feat: transaction list with inline category editing"
```

---

## Task 10: Kategorie i reguły CRUD

**Files:**

- Create: `src/server/actions/categories.ts`
- Create: `src/app/(app)/categories/page.tsx`

- [ ] **Step 1: Actions**

- `createCategory`, `deleteCategory` (blokuj jeśli isDefault)
- `createRule`, `deleteRule` — pola: matchField, matchContains, categoryId, priority

- [ ] **Step 2: UI**

Lista kategorii z kolorem, formularz nowej reguły, tabela reguł z usuwaniem.

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/categories.ts src/app/(app)/categories/
git commit -m "feat: categories and rules management"
```

---

## Task 11: Dashboard (wykresy A + B)

**Files:**

- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/components/dashboard/ContextToggle.tsx`
- Create: `src/components/dashboard/CategoryChart.tsx`
- Create: `src/components/dashboard/MerchantChart.tsx`
- Create: `src/server/actions/dashboard.ts`

- [ ] **Step 1: Server loader**

Pobierz transakcje dla zakresu dat i `accountIdsForContext`. Podziel na bieżący i poprzedni okres (ta sama długość).

Wywołaj `categoryBreakdown` i `topMerchants`.

- [ ] **Step 2: Recharts**

- PieChart / BarChart — udział kategorii
- BarChart poziomy — top merchantów z `changePercent` w tooltip

- [ ] **Step 3: Przełącznik firma/dom/razem**

URL searchParams `?context=dom&from=2025-01-01&to=2025-03-31`

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/dashboard/ src/components/dashboard/ src/server/actions/dashboard.ts
git commit -m "feat: dashboard with category and merchant analytics"
```

---

## Task 12: Ustawienia — konta, zaproszenie, RODO

**Files:**

- Create: `src/server/actions/workspace.ts`
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Konta bankowe**

CRUD `Account` (type firma/dom, name).

- [ ] **Step 2: Zaproszenie partnera**

Wyświetl `workspace.inviteCode` + przycisk kopiuj. Instrukcja: druga osoba rejestruje się z kodem.

- [ ] **Step 3: Eksport CSV**

`exportWorkspaceCsv` — wszystkie transakcje workspace jako CSV (UTF-8, `;`).

- [ ] **Step 4: Usunięcie danych**

`deleteAllWorkspaceData` — cascade przez Prisma (tylko dla ownera lub obu — MVP: każdy member, z potwierdzeniem wpisania nazwy workspace).

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/workspace.ts src/app/(app)/settings/
git commit -m "feat: settings, invite code, export and data deletion"
```

---

## Task 13: Layout aplikacji i nawigacja (PL)

**Files:**

- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/AppNav.tsx`

- [ ] **Step 1: Shell**

Sidebar / bottom nav na mobile: Dashboard, Transakcje, Import, Kategorie, Ustawienia.

- [ ] **Step 2: Strona „Do ogarnięcia”**

Link z dashboardu: `/transactions?uncategorized=1` — licznik niekategoryzowanych.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/layout.tsx src/components/AppNav.tsx
git commit -m "feat: app shell and polish navigation"
```

---

## Task 14: Test integracyjny importu (opcjonalny ale zalecany)

**Files:**

- Create: `tests/integration/import-flow.test.ts`

- [ ] **Step 1: Test z Prismą na SQLite testowej**

W `package.json` script test:integration z `DATABASE_URL=file:./test.db` — lub użyj `@prisma/client` z mockiem repozytorium.

Minimalny test: parse + hash + categorize bez DB jeśli integracja zbyt ciężka — **wymagane minimum:** wszystkie testy `npm test` PASS.

- [ ] **Step 2: Commit**

```bash
git commit -m "test: integration coverage for import pipeline"
```

---

## Task 15: README i przygotowanie deploy

**Files:**

- Modify: `README.md`
- Create: `docker-compose.yml` (opcjonalnie — Postgres lokalnie)

- [ ] **Step 1: README po polsku**

Sekcje: wymagania, `.env`, migracje, dev, test, jak pobrać CSV z mBank, deploy Vercel + Neon.

- [ ] **Step 2: docker-compose dla Postgres**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: analiza
      POSTGRES_PASSWORD: analiza
      POSTGRES_DB: analiza_wyciagow
    ports:
      - "5432:5432"
```

- [ ] **Step 3: Commit**

```bash
git add README.md docker-compose.yml
git commit -m "docs: setup and deployment instructions"
```

---

## Self-review (spec → plan)

| Wymaganie speca             | Task                    |
| --------------------------- | ----------------------- |
| mBank CSV import            | Task 4, 8               |
| Duplikaty hash              | Task 3, 8               |
| firma/dom/razem             | Task 6 filters, Task 11 |
| 2 użytkowników workspace    | Task 7, 12              |
| Reguły + pamięć kontrahenta | Task 5, 9               |
| Wykres kategorii (A)        | Task 6, 11              |
| Top merchantów (B)          | Task 6, 11              |
| Nieskategoryzowane          | Task 9, 13              |
| Ekrany MVP §7               | Tasks 7–13              |
| RODO eksport/usuń           | Task 12                 |
| PL UI                       | Task 7, 13              |
| Open Banking v2             | Poza planem (świadomie) |
| Insight C v1.1              | Poza planem (świadomie) |

**Placeholder scan:** brak TBD w planie.

**Uwaga implementacyjna:** Po pierwszym prawdziwym eksporcie mBank zaktualizuj `tests/fixtures/mbank-sample.csv` — nagłówki mogą mieć drobne różnice (`#` prefix).

---

## Kolejność i szacunek

| Faza        | Taski | ~czas |
| ----------- | ----- | ----- |
| Fundament   | 1–3   | 2–3 h |
| Domena      | 4–6   | 3–4 h |
| Auth + dane | 7–8   | 4–5 h |
| UI core     | 9–13  | 6–8 h |
| Docs        | 14–15 | 1–2 h |

**Razem MVP:** ~16–22 h czystego kodowania (1–2 tygodnie wieczorów).

---

## Kryteria ukończenia MVP (z speca §10)

- [ ] Import 2 miesięcy mBank firma+dom bez duplikatów
- [ ] > 80% transakcji z kategorią po tygodniu użytkowania
- [ ] Dashboard odpowiada na „na co wydajemy najwięcej” w 5 min
- [ ] `npm test` — wszystkie testy zielone
- [ ] Para zalogowana na 2 kontach w tym samym workspace
