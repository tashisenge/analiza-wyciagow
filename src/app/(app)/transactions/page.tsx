import { redirect } from "next/navigation";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildTransactionsReturnTo,
  prismaCategoryFilter,
  transactionActiveFilter,
  type TransactionSearchParams,
} from "@/lib/transactions/page-filters";
import { buildSimilarCountByTransactionId } from "@/lib/transactions/similar-transaction-count";
import { updateTransactionCategory } from "@/server/actions/transactions";

async function changeCategoryAction(formData: FormData): Promise<void> {
  "use server";
  const txRaw = formData.get("transactionId");
  const catRaw = formData.get("categoryId");
  const returnToRaw = formData.get("returnTo");
  const transactionId = typeof txRaw === "string" ? txRaw : "";
  const categoryId = typeof catRaw === "string" ? catRaw : "";
  const returnTo =
    typeof returnToRaw === "string" && returnToRaw ? returnToRaw : "/transactions";

  const applyToSimilar = formData.get("applyToSimilar") === "on";
  const createRule = formData.get("createRule") === "on";

  const result = await updateTransactionCategory(transactionId, categoryId, {
    applyToSimilar,
    createRule,
  });
  if (!result.ok) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(
      `${returnTo}${separator}error=${encodeURIComponent(result.error ?? "Błąd")}`,
    );
  }
  if (result.updatedCount && result.updatedCount > 1) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(
      `${returnTo}${separator}msg=${encodeURIComponent(
        `Zaktualizowano ${String(result.updatedCount)} transakcji (w tym podobne).`,
      )}`,
    );
  }
  redirect(returnTo);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionSearchParams & { error?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const workspaceId = session.user.workspaceId;
  const params = await searchParams;
  const context = (params.context ?? "razem") as ContextFilter;

  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const categoryFilter = prismaCategoryFilter(params, workspaceId);

  const [transactions, categories, filterCategory] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        workspaceId,
        accountId: { in: accountIds },
        ...(params.uncategorized === "1" ? { categoryId: null } : {}),
        ...(params.counterparty
          ? {
              counterparty: {
                contains: params.counterparty,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...categoryFilter,
      },
      orderBy: { bookedAt: "desc" },
      take: 200,
      include: { category: true, account: true },
    }),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    params.categoryId
      ? prisma.category.findFirst({
          where: { id: params.categoryId, workspaceId },
          select: { name: true },
        })
      : null,
  ]);

  const returnTo = buildTransactionsReturnTo(params);
  const categoryLabel = filterCategory?.name ?? params.categoryName;
  const similarCounts = buildSimilarCountByTransactionId(transactions);
  const rows = transactions.map((tx) => ({
    ...tx,
    similarCount: similarCounts.get(tx.id) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transakcje</h1>
      <TransactionFilters active={transactionActiveFilter(params)} />
      {categoryLabel ? (
        <p className="text-sm text-slate-600">
          Filtr: kategoria <strong>{categoryLabel}</strong> —{" "}
          <a href="/transactions" className="text-indigo-600 underline">
            wyczyść filtr
          </a>
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">{params.error}</p>
      ) : null}
      {params.msg ? (
        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {params.msg}
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Kolumna „Podobne” — ten sam kontrahent na liście. Przy zmianie kategorii możesz
        zastosować do podobnych bez kategorii; opcjonalnie tworzona jest reguła i pamięć
        kontrahenta (kolejny import i kategoryzacja).
      </p>
      <TransactionsTable
        transactions={rows}
        categories={categories}
        returnTo={returnTo}
        changeCategoryAction={changeCategoryAction}
      />
    </div>
  );
}
