import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

export type TransactionQuickFilterKey =
  | "all"
  | "uncategorized"
  | "discretionary"
  | "firma"
  | "dom";

export function buildTransactionQuickFilterHref(
  key: TransactionQuickFilterKey,
  params: TransactionSearchParams,
): string {
  switch (key) {
    case "all":
      return "/transactions";
    case "uncategorized":
      return buildTransactionsHref(params, {
        uncategorized: "1",
        categoryId: undefined,
        categoryName: undefined,
        discretionary: undefined,
        tagId: undefined,
      });
    case "discretionary":
      return buildTransactionsHref(params, {
        discretionary: "1",
        uncategorized: undefined,
        categoryId: undefined,
        categoryName: undefined,
        tagId: undefined,
      });
    case "firma":
      return buildTransactionsHref(params, {
        context: "firma",
        uncategorized: undefined,
        discretionary: undefined,
        categoryId: undefined,
        categoryName: undefined,
        tagId: undefined,
      });
    case "dom":
      return buildTransactionsHref(params, {
        context: "dom",
        uncategorized: undefined,
        discretionary: undefined,
        categoryId: undefined,
        categoryName: undefined,
        tagId: undefined,
      });
  }
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
    });
  }
  return buildTransactionsHref(params, {
    categoryId,
    categoryName: undefined,
    uncategorized: undefined,
    discretionary: undefined,
  });
}
