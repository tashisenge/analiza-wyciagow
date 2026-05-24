import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  if (value) {
    params.set(key, value);
  }
}

export function appendTransactionSearchParams(
  params: URLSearchParams,
  search: TransactionSearchParams,
): void {
  setIfPresent(params, "uncategorized", search.uncategorized);
  setIfPresent(params, "context", search.context);
  setIfPresent(params, "categoryId", search.categoryId);
  setIfPresent(params, "categoryName", search.categoryName);
  setIfPresent(params, "counterparty", search.counterparty);
  setIfPresent(params, "tagId", search.tagId);
  setIfPresent(params, "mbankCategory", search.mbankCategory);
  setIfPresent(params, "dateFrom", search.dateFrom);
  setIfPresent(params, "dateTo", search.dateTo);
}
