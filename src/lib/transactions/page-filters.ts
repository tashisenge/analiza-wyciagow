import { appendTransactionSearchParams } from "@/lib/transactions/build-transactions-url";

export interface TransactionSearchParams {
  uncategorized?: string;
  discretionary?: string;
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

export type TransactionRawSearchParams = {
  [K in keyof TransactionSearchParams]?: string | string[];
} & {
  error?: string | string[];
};

function singleSearchParam(value: string | string[] | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalizuje Next.js searchParams do TransactionSearchParams. */
export function parseTransactionSearchParams(
  raw: TransactionRawSearchParams,
): TransactionSearchParams & { error?: string } {
  return {
    uncategorized: singleSearchParam(raw.uncategorized),
    discretionary: singleSearchParam(raw.discretionary),
    context: trimOrUndefined(singleSearchParam(raw.context)),
    categoryId: trimOrUndefined(singleSearchParam(raw.categoryId)),
    categoryName: trimOrUndefined(singleSearchParam(raw.categoryName)),
    counterparty: trimOrUndefined(singleSearchParam(raw.counterparty)),
    tagId: trimOrUndefined(singleSearchParam(raw.tagId)),
    mbankCategory: trimOrUndefined(singleSearchParam(raw.mbankCategory)),
    dateFrom: trimOrUndefined(singleSearchParam(raw.dateFrom)),
    dateTo: trimOrUndefined(singleSearchParam(raw.dateTo)),
    msg: trimOrUndefined(singleSearchParam(raw.msg)),
    error: trimOrUndefined(singleSearchParam(raw.error)),
  };
}

export function transactionActiveFilter(params: TransactionSearchParams): string {
  if (params.tagId) {
    return "tag";
  }
  if (params.categoryId || params.categoryName) {
    return "category";
  }
  if (params.discretionary === "1") {
    return "discretionary";
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
  if (params.uncategorized === "1") {
    return {};
  }
  const categoryId = params.categoryId?.trim();
  if (categoryId) {
    return { categoryId };
  }
  const categoryName = params.categoryName?.trim();
  if (categoryName) {
    return { category: { name: categoryName, workspaceId } };
  }
  return {};
}
