import { redirect } from "next/navigation";

import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionFlashMessage } from "@/components/transactions/TransactionFlashMessage";
import { TransactionsHelpPanel } from "@/components/transactions/TransactionsHelpPanel";
import { TransactionsPageClient } from "@/components/transactions/TransactionsPageClient";
import { TransactionsPagination } from "@/components/transactions/TransactionsPagination";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { ensurePersonTags } from "@/lib/tags/ensure-person-tags";
import { buildCategoryChangeRedirectUrl } from "@/lib/transactions/build-category-change-redirect";
import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";
import { loadTransactionsPageData } from "@/lib/transactions/load-transactions-page";
import {
  buildTransactionsReturnTo,
  parseTransactionSearchParams,
  transactionActiveFilter,
  type TransactionRawSearchParams,
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
  redirect(buildCategoryChangeRedirectUrl(returnTo, result, categoryId));
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionRawSearchParams>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const params = parseTransactionSearchParams(await searchParams);
  const context = (params.context ?? "razem") as ContextFilter;
  await ensurePersonTags(session.user.workspaceId);
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
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    context: context === "razem" ? "razem" : context,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transakcje"
        lead="Kategoryzuj pojedynczo lub masowo po kontrahencie. Taguj operacje i oznaczaj subskrypcje."
        tip="Lista jest paginowana (50 pozycji na stronę). Parametr cursor w URL zachowuje filtry."
        actions={
          <TransactionFilters
            active={transactionActiveFilter(params)}
            params={params}
            categories={pageData.categories}
            tags={pageData.allTags}
          />
        }
      />
      {pageData.filterCategoryName ? (
        <p className="text-sm text-slate-600">
          Filtr: kategoria <strong>{pageData.filterCategoryName}</strong> —{" "}
          <a
            href={buildTransactionsHref(params, {
              categoryId: undefined,
              categoryName: undefined,
              cursor: undefined,
            })}
            className="link-brand"
          >
            wyczyść filtr kategorii
          </a>
        </p>
      ) : null}
      {pageData.filterTagName ? (
        <p className="text-sm text-slate-600">
          Filtr: tag <strong>{pageData.filterTagName}</strong> —{" "}
          <a
            href={buildTransactionsHref(params, { tagId: undefined, cursor: undefined })}
            className="link-brand"
          >
            wyczyść filtr tagu
          </a>
        </p>
      ) : null}
      {params.discretionary === "1" ? (
        <p className="text-sm text-slate-600">
          Filtr: tylko wydatki <strong>opcjonalne</strong> —{" "}
          <a
            href={buildTransactionsHref(params, {
              discretionary: undefined,
              cursor: undefined,
            })}
            className="link-brand"
          >
            wyczyść
          </a>
        </p>
      ) : null}
      {params.counterparty ? (
        <p className="text-sm text-slate-600">
          Filtr: kontrahent zawiera <strong>{params.counterparty}</strong> —{" "}
          <a
            href={buildTransactionsHref(params, {
              counterparty: undefined,
              cursor: undefined,
            })}
            className="link-brand"
          >
            wyczyść filtr nazwy
          </a>
        </p>
      ) : null}
      <TransactionFlashMessage error={params.error} msg={params.msg} />
      <TransactionsPagination
        params={params}
        rowCount={pageData.rows.length}
        nextCursor={pageData.nextCursor}
        prevCursor={pageData.prevCursor}
        buildHref={buildTransactionsHref}
      />
      <TransactionsHelpPanel />
      <TransactionsPageClient
        rows={pageData.rows}
        categories={pageData.categories}
        allTags={pageData.allTags}
        returnTo={returnTo}
        listParams={params}
        bulkFilters={bulkFilters}
        changeCategoryAction={changeCategoryAction}
      />
    </div>
  );
}
