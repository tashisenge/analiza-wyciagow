import type { Prisma } from "@prisma/client";

import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

export type TransactionSortField = "date" | "name" | "similar";
export type TransactionSortDirection = "asc" | "desc";

export interface TransactionSortState {
  field: TransactionSortField;
  direction: TransactionSortDirection;
}

export interface SortableTransactionRow {
  id: string;
  bookedAt: Date;
  counterparty: string;
  similarCounts: { byCounterparty: number };
}

export function parseTransactionSort(
  params: TransactionSearchParams,
): TransactionSortState {
  const field: TransactionSortField =
    params.sort === "name" || params.sort === "similar" ? params.sort : "date";
  const direction: TransactionSortDirection = params.sortDir === "asc" ? "asc" : "desc";
  return { field, direction };
}

export function buildTransactionOrderBy(
  sort: TransactionSortState,
): Prisma.TransactionOrderByWithRelationInput {
  if (sort.field === "name") {
    return { counterparty: sort.direction };
  }
  return { bookedAt: sort.direction };
}

export function sortTransactionRows<T extends SortableTransactionRow>(
  rows: T[],
  sort: TransactionSortState,
): T[] {
  if (sort.field === "date") {
    return rows;
  }

  const multiplier = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    if (sort.field === "name") {
      const byName = left.counterparty.localeCompare(right.counterparty, "pl");
      if (byName !== 0) {
        return multiplier * byName;
      }
      return right.bookedAt.getTime() - left.bookedAt.getTime();
    }

    const bySimilar =
      left.similarCounts.byCounterparty - right.similarCounts.byCounterparty;
    if (bySimilar !== 0) {
      return multiplier * bySimilar;
    }
    return right.bookedAt.getTime() - left.bookedAt.getTime();
  });
}

export function buildTransactionSortHref(
  params: TransactionSearchParams,
  field: TransactionSortField,
  buildHref: (
    current: TransactionSearchParams,
    patch: Partial<Record<keyof TransactionSearchParams, string | undefined>>,
  ) => string,
): string {
  const current = parseTransactionSort(params);
  const nextDirection: TransactionSortDirection =
    current.field === field && current.direction === "desc" ? "asc" : "desc";
  return buildHref(params, { sort: field, sortDir: nextDirection });
}
