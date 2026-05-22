import { redirect } from "next/navigation";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsHelpPanel } from "@/components/transactions/TransactionsHelpPanel";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import { buildTransactionTableRows } from "@/lib/transactions/build-transaction-table-rows";
import { loadPairedOwnAccountTransferKeys } from "@/lib/transactions/load-workspace-transfer-pairs";
import {
  buildTransactionsReturnTo,
  prismaCategoryFilter,
  transactionActiveFilter,
  type TransactionSearchParams,
} from "@/lib/transactions/page-filters";
import { buildSimilarCountsByTransactionId } from "@/lib/transactions/similar-transaction-count";
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
  const matchSameAmount = formData.get("matchSameAmount") === "on";
  const createRule = formData.get("createRule") === "on";

  const result = await updateTransactionCategory(transactionId, categoryId, {
    applyToSimilar,
    matchSameAmount,
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
    const cleared = !categoryId.trim();
    const message = cleared
      ? `Usunięto kategorię z ${String(result.updatedCount)} transakcji.`
      : `Zaktualizowano ${String(result.updatedCount)} transakcji (w tym podobne).`;
    redirect(`${returnTo}${separator}msg=${encodeURIComponent(message)}`);
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

  const [transactions, categories, filterCategory, transferCategoryId] =
    await Promise.all([
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
      ensureTransferCategory(workspaceId),
    ]);

  const returnTo = buildTransactionsReturnTo(params);
  const categoryLabel = filterCategory?.name ?? params.categoryName;
  const similarCounts = buildSimilarCountsByTransactionId(
    transactions.map((tx) => ({
      id: tx.id,
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
      currency: tx.currency,
    })),
  );
  const pairedTransferKeys = await loadPairedOwnAccountTransferKeys({
    workspaceId,
    accountIds,
    anchorTransactions: transactions.map((tx) => ({
      id: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  });
  const rows = buildTransactionTableRows({
    transactions,
    transferCategoryId,
    similarCounts,
    pairedTransferKeys,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transakcje"
        lead="Kategoryzuj pojedynczo lub masowo po kontrahencie. Zmiana kategorii zapisuje się od razu."
        tip="Lista pokazuje do 200 ostatnich pozycji z wybranych kont."
        actions={<TransactionFilters active={transactionActiveFilter(params)} />}
      />
      {categoryLabel ? (
        <p className="text-sm text-slate-600">
          Filtr: kategoria <strong>{categoryLabel}</strong> —{" "}
          <a href="/transactions" className="link-brand">
            wyczyść filtr
          </a>
        </p>
      ) : null}
      {params.error ? <p className="alert-error">{params.error}</p> : null}
      {params.msg ? <p className="alert-success">{params.msg}</p> : null}
      <TransactionsHelpPanel />
      <TransactionsTable
        transactions={rows}
        categories={categories}
        returnTo={returnTo}
        changeCategoryAction={changeCategoryAction}
      />
    </div>
  );
}
