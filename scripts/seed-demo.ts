import { existsSync, readFileSync } from "fs";
import { basename, join } from "path";

import bcrypt from "bcryptjs";

import { categoryBreakdown } from "../src/lib/analytics/category-breakdown";
import { topMerchants } from "../src/lib/analytics/top-merchants";
import { categorizeTransaction } from "../src/lib/categorization/categorize-transaction";
import { prisma } from "../src/lib/db";
import {
  assignMbankCategoriesForWorkspace,
  buildCategoriesByName,
  syncMbankCategories,
} from "../src/lib/mbank/sync-categories";
import { parseMbankCsv } from "../src/lib/mbank-csv";
import { seedCategoriesForWorkspace } from "../src/lib/seed-default-categories";
import { buildTransactionDedupeHash } from "../src/lib/transaction-hash";

const LOCAL_CSV_PATH = join(
  process.cwd(),
  "lista_operacji_250521_260521_202605211403211364.csv",
);
const FIXTURE_CSV_PATH = join(process.cwd(), "tests/fixtures/mbank-sample.csv");

function resolveDemoCsvPath(): string {
  const fromEnv = process.env["DEMO_CSV_PATH"];
  if (fromEnv) {
    return fromEnv;
  }
  if (existsSync(LOCAL_CSV_PATH)) {
    return LOCAL_CSV_PATH;
  }
  return FIXTURE_CSV_PATH;
}

async function ensureDemoWorkspace(): Promise<{
  workspaceId: string;
  accountId: string;
  email: string;
  password: string;
}> {
  const email = "demo@analiza.local";
  const password = "demo12345";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: existing.id },
    });
    const account = await prisma.account.findFirst({
      where: { workspaceId: member?.workspaceId, type: "dom" },
    });
    if (member && account) {
      return { workspaceId: member.workspaceId, accountId: account.id, email, password };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const workspace = await prisma.workspace.create({
    data: { name: "Demo — Adam & Magdalena" },
  });
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Demo",
      memberships: { create: { workspaceId: workspace.id } },
    },
  });
  const [firma, dom] = await Promise.all([
    prisma.account.create({
      data: { workspaceId: workspace.id, type: "firma", name: "Konto firmowe (mBank)" },
    }),
    prisma.account.create({
      data: { workspaceId: workspace.id, type: "dom", name: "Konto domowe (mBank)" },
    }),
  ]);
  await seedCategoriesForWorkspace(workspace.id, (data) =>
    prisma.category.create({ data }),
  );

  return { workspaceId: workspace.id, accountId: dom.id, email, password };
}

async function importFullCsv(workspaceId: string, accountId: string): Promise<void> {
  const csvPath = resolveDemoCsvPath();
  const csv = readFileSync(csvPath, "utf-8");
  const rows = parseMbankCsv(csv);
  console.log(`\nW pliku CSV: ${String(rows.length)} transakcji`);

  const existing = await prisma.transaction.findMany({
    where: { workspaceId },
    select: { dedupeHash: true },
  });
  const existingHashes = new Set(existing.map((row) => row.dedupeHash));

  const [rules, memories] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId } }),
  ]);

  await syncMbankCategories(
    workspaceId,
    rows.map((row) => row.mbankCategory),
  );
  const categoriesByName = await buildCategoriesByName(workspaceId);

  const batch = await prisma.importBatch.create({
    data: {
      workspaceId,
      accountId,
      fileName: basename(csvPath),
      newCount: 0,
      skippedCount: 0,
    },
  });

  let newCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const dedupeHash = buildTransactionDedupeHash({
      bookedAt: row.bookedAt,
      amount: row.amount,
      description: row.description,
      accountId,
    });
    if (existingHashes.has(dedupeHash)) {
      skippedCount += 1;
      continue;
    }
    const categoryId = categorizeTransaction(row, rules, memories, categoriesByName);
    await prisma.transaction.create({
      data: {
        workspaceId,
        accountId,
        importBatchId: batch.id,
        dedupeHash,
        bookedAt: row.bookedAt,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        counterparty: row.counterparty,
        mbankCategory: row.mbankCategory,
        categoryId,
      },
    });
    existingHashes.add(dedupeHash);
    newCount += 1;
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { newCount, skippedCount },
  });

  console.log(
    `Import: ${String(newCount)} nowych, ${String(skippedCount)} pominiętych (duplikaty)`,
  );

  const reassigned = await assignMbankCategoriesForWorkspace(workspaceId);
  console.log(`Kategorie mBank (1:1): ${String(reassigned)} transakcji zaktualizowanych`);
}

async function printAnalytics(workspaceId: string): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const all = await prisma.transaction.findMany({
    where: { workspaceId, bookedAt: { gte: prevMonthStart, lte: now } },
    include: { category: true },
  });

  const current = all.filter((tx) => tx.bookedAt >= monthStart);
  const previous = all.filter(
    (tx) => tx.bookedAt >= prevMonthStart && tx.bookedAt < monthStart,
  );

  const expenses = current.filter((tx) => Number(tx.amount) < 0);
  const income = current.filter((tx) => Number(tx.amount) > 0);
  const totalExpenses = expenses.reduce((s, tx) => s + Math.abs(Number(tx.amount)), 0);
  const totalIncome = income.reduce((s, tx) => s + Number(tx.amount), 0);

  console.log("\n=== Podsumowanie (bieżący miesiąc) ===");
  console.log(`Transakcji: ${String(current.length)}`);
  console.log(`Wydatki: ${totalExpenses.toFixed(2)} PLN`);
  console.log(`Wpływy: ${totalIncome.toFixed(2)} PLN`);

  const byMbank = new Map<string, number>();
  for (const tx of expenses) {
    const key = tx.mbankCategory || "Bez kategorii";
    byMbank.set(key, (byMbank.get(key) ?? 0) + Math.abs(Number(tx.amount)));
  }
  const mbankSorted = [...byMbank.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  console.log("\n=== Top kategorie mBank (bieżący miesiąc) ===");
  for (const [name, total] of mbankSorted) {
    console.log(`  ${total.toFixed(2)} PLN — ${name}`);
  }

  const slices = categoryBreakdown(
    current.map((tx) => ({
      amount: tx.amount.toString(),
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? tx.mbankCategory,
    })),
  );
  console.log("\n=== Struktura wydatków (app) ===");
  for (const slice of slices.slice(0, 10)) {
    console.log(
      `  ${slice.total.toFixed(2)} PLN (${String(slice.percent)}%) — ${slice.categoryName}`,
    );
  }

  const merchants = topMerchants(
    current.map((tx) => ({
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
    })),
    previous.map((tx) => ({
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
    })),
    15,
  );
  console.log("\n=== Top kontrahenci (bieżący miesiąc) ===");
  for (const row of merchants) {
    const change =
      row.changePercent !== null ? ` (${String(row.changePercent)}% m/m)` : "";
    console.log(`  ${row.total.toFixed(2)} PLN — ${row.counterparty}${change}`);
  }

  const uncategorized = current.filter((tx) => !tx.categoryId).length;
  console.log(
    `\nBez kategorii app: ${String(uncategorized)} / ${String(current.length)}`,
  );
}

async function main(): Promise<void> {
  console.log("Ładowanie danych demo…");
  const { workspaceId, accountId, email, password } = await ensureDemoWorkspace();
  await importFullCsv(workspaceId, accountId);
  await printAnalytics(workspaceId);

  console.log("\n=== Aplikacja web ===");
  console.log("  npm run dev");
  console.log(`  Login: ${email} / ${password}`);
  console.log("  http://localhost:3000/dashboard");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
