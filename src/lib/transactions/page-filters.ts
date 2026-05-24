import { appendTransactionSearchParams } from "@/lib/transactions/build-transactions-url";

export interface TransactionSearchParams {
  uncategorized?: string;
  context?: string;
  categoryId?: string;
  categoryName?: string;
  counterparty?: string;
  tagId?: string;
  mbankCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  msg?: string;
}

export function transactionActiveFilter(params: TransactionSearchParams): string {
  if (params.tagId) {
    return "tag";
  }
  if (params.categoryId || params.categoryName) {
    return "category";
  }
  if (params.uncategorized === "1") {
    return "uncategorized";
  }
  if (params.context === "firma") {
    return "firma";
  }
  if (params.context === "dom") {
    return "dom";
  }
  return "all";
}

export function buildTransactionsReturnTo(params: TransactionSearchParams): string {
  const search = new URLSearchParams();
  appendTransactionSearchParams(search, params);
  const query = search.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function prismaCategoryFilter(
  params: TransactionSearchParams,
  workspaceId: string,
):
  | { categoryId: string }
  | { category: { name: string; workspaceId: string } }
  | Record<string, never> {
  if (params.categoryId != null) {
    return { categoryId: params.categoryId };
  }
  if (params.categoryName != null) {
    return { category: { name: params.categoryName, workspaceId } };
  }
  return {};
}
