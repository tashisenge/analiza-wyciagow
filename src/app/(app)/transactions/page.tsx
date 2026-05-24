import { redirect } from "next/navigation";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsHelpPanel } from "@/components/transactions/TransactionsHelpPanel";
import { TransactionsPageClient } from "@/components/transactions/TransactionsPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";
import { loadTransactionsPageData } from "@/lib/transactions/load-transactions-page";
import {
  buildTransactionsReturnTo,
  transactionActiveFilter,
  type TransactionSearchParams,
} from "@/lib/transactions/page-filters";
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
  const params = await searchParams;
  const context = (params.context ?? "razem") as ContextFilter;
  const pageData = await loadTransactionsPageData(
    session.user.workspaceId,
    context,
    params,
  );
  const returnTo = buildTransactionsReturnTo(params);
  const bulkFilters: BulkCategoryFilters = {
    counterpartyContains: params.counterparty,
    mbankCategory: params.mbankCategory,
    uncategorizedOnly: params.uncategorized === "1",
    tagId: params.tagId,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    context: context === "razem" ? "razem" : context,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transakcje"
        lead="Kategoryzuj pojedynczo lub masowo po kontrahencie. Taguj operacje i oznaczaj subskrypcje."
        tip="Lista pokazuje do 200 ostatnich pozycji z wybranych kont."
        actions={<TransactionFilters active={transactionActiveFilter(params)} />}
      />
      {pageData.filterCategoryName ? (
        <p className="text-sm text-slate-600">
          Filtr: kategoria <strong>{pageData.filterCategoryName}</strong> —{" "}
          <a href="/transactions" className="link-brand">
            wyczyść filtr
          </a>
        </p>
      ) : null}
      {pageData.filterTagName ? (
        <p className="text-sm text-slate-600">
          Filtr: tag <strong>{pageData.filterTagName}</strong> —{" "}
          <a href="/transactions" className="link-brand">
            wyczyść filtr
          </a>
        </p>
      ) : null}
      {params.error ? <p className="alert-error">{params.error}</p> : null}
      {params.msg ? <p className="alert-success">{params.msg}</p> : null}
      <TransactionsHelpPanel />
      <TransactionsPageClient
        rows={pageData.rows}
        categories={pageData.categories}
        allTags={pageData.allTags}
        returnTo={returnTo}
        bulkFilters={bulkFilters}
        changeCategoryAction={changeCategoryAction}
      />
    </div>
  );
}
