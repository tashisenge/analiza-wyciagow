import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

export type TransactionQuickFilterKey =
  | "all"
  | "uncategorized"
  | "discretionary"
  | "firma"
  | "dom";

type FilterPatch = Partial<Record<keyof TransactionSearchParams, string | undefined>>;

const CLEAR_LIST_FILTERS: FilterPatch = {
  categoryId: undefined,
  categoryName: undefined,
  discretionary: undefined,
  tagId: undefined,
  uncategorized: undefined,
  cursor: undefined,
};

const QUICK_FILTER_PATCHES: Record<
  Exclude<TransactionQuickFilterKey, "all">,
  FilterPatch
> = {
  uncategorized: { ...CLEAR_LIST_FILTERS, uncategorized: "1" },
  discretionary: { ...CLEAR_LIST_FILTERS, discretionary: "1" },
  firma: { ...CLEAR_LIST_FILTERS, context: "firma" },
  dom: { ...CLEAR_LIST_FILTERS, context: "dom" },
};

export function buildTransactionQuickFilterHref(
  key: TransactionQuickFilterKey,
  params: TransactionSearchParams,
): string {
  if (key === "all") {
    return "/transactions";
  }
  return buildTransactionsHref(params, QUICK_FILTER_PATCHES[key]);
}

export function buildTransactionTagFilterHref(
  params: TransactionSearchParams,
  tagId: string,
): string {
  return buildTransactionsHref(params, {
    tagId,
    uncategorized: undefined,
    categoryId: undefined,
    categoryName: undefined,
    cursor: undefined,
  });
}

export function buildTransactionCategoryFilterHref(
  params: TransactionSearchParams,
  categoryId: string,
): string {
  if (!categoryId) {
    return buildTransactionsHref(params, {
      categoryId: undefined,
      categoryName: undefined,
      cursor: undefined,
    });
  }
  return buildTransactionsHref(params, {
    categoryId,
    categoryName: undefined,
    uncategorized: undefined,
    discretionary: undefined,
    cursor: undefined,
  });
}
