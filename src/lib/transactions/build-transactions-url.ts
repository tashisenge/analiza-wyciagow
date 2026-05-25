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
  setIfPresent(params, "discretionary", search.discretionary);
  setIfPresent(params, "context", search.context);
  setIfPresent(params, "categoryId", search.categoryId);
  setIfPresent(params, "categoryName", search.categoryName);
  setIfPresent(params, "counterparty", search.counterparty);
  setIfPresent(params, "tagId", search.tagId);
  setIfPresent(params, "mbankCategory", search.mbankCategory);
  setIfPresent(params, "dateFrom", search.dateFrom);
  setIfPresent(params, "dateTo", search.dateTo);
  setIfPresent(params, "sort", search.sort);
  setIfPresent(params, "sortDir", search.sortDir);
}

export function buildTransactionsHref(
  current: TransactionSearchParams,
  patch: Partial<Record<keyof TransactionSearchParams, string | undefined>>,
): string {
  const merged: TransactionSearchParams = { ...current };
  for (const [key, value] of Object.entries(patch) as [
    keyof TransactionSearchParams,
    string | undefined,
  ][]) {
    if (value === undefined || value === "") {
      merged[key] = undefined;
    } else {
      merged[key] = value;
    }
  }

  const params = new URLSearchParams();
  appendTransactionSearchParams(params, merged);
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}
