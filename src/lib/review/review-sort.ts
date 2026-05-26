import type { Prisma } from "@prisma/client";

import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";
import { getReviewReason } from "@/lib/review/review-queue-filters";

export type ReviewSortField =
  | "date"
  | "counterparty"
  | "mbankCategory"
  | "appCategory"
  | "amount"
  | "reason";

export type ReviewSortDirection = "asc" | "desc";

export interface ReviewSortState {
  field: ReviewSortField;
  direction: ReviewSortDirection;
}

export interface SortableReviewItem {
  bookedAt: Date;
  counterparty: string;
  mbankCategory: string;
  categoryName: string | null;
  categoryId: string | null;
  amount: string;
}

const REASON_ORDER: Record<string, number> = {
  mbank_uncategorized: 0,
  app_missing: 1,
  name_mismatch: 2,
};

export function parseReviewSort(filters: ReviewQueueFilters): ReviewSortState {
  const field: ReviewSortField =
    filters.sort === "counterparty" ||
    filters.sort === "mbankCategory" ||
    filters.sort === "appCategory" ||
    filters.sort === "amount" ||
    filters.sort === "reason"
      ? filters.sort
      : "date";
  const direction: ReviewSortDirection = filters.sortDir === "asc" ? "asc" : "desc";
  return { field, direction };
}

export function buildReviewOrderBy(
  sort: ReviewSortState,
): Prisma.TransactionOrderByWithRelationInput {
  switch (sort.field) {
    case "counterparty":
      return { counterparty: sort.direction };
    case "mbankCategory":
      return { mbankCategory: sort.direction };
    case "appCategory":
      return { category: { name: sort.direction } };
    case "amount":
      return { amount: sort.direction };
    default:
      return { bookedAt: sort.direction };
  }
}

function compareCounterparty(left: SortableReviewItem, right: SortableReviewItem): number {
  return left.counterparty.localeCompare(right.counterparty, "pl");
}

function compareMbank(left: SortableReviewItem, right: SortableReviewItem): number {
  return left.mbankCategory.localeCompare(right.mbankCategory, "pl");
}

function compareApp(left: SortableReviewItem, right: SortableReviewItem): number {
  return (left.categoryName ?? "").localeCompare(right.categoryName ?? "", "pl");
}

function compareAmount(left: SortableReviewItem, right: SortableReviewItem): number {
  return Number.parseFloat(left.amount) - Number.parseFloat(right.amount);
}

function compareReason(left: SortableReviewItem, right: SortableReviewItem): number {
  const leftOrder = REASON_ORDER[getReviewReason(left)] ?? 99;
  const rightOrder = REASON_ORDER[getReviewReason(right)] ?? 99;
  return leftOrder - rightOrder;
}

function compareDate(left: SortableReviewItem, right: SortableReviewItem): number {
  return left.bookedAt.getTime() - right.bookedAt.getTime();
}

const COMPARATORS: Record<
  ReviewSortField,
  (left: SortableReviewItem, right: SortableReviewItem) => number
> = {
  date: compareDate,
  counterparty: compareCounterparty,
  mbankCategory: compareMbank,
  appCategory: compareApp,
  amount: compareAmount,
  reason: compareReason,
};

export function sortReviewItems<T extends SortableReviewItem>(
  items: T[],
  sort: ReviewSortState,
): T[] {
  const compare = COMPARATORS[sort.field];
  const multiplier = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    const cmp = compare(left, right);
    if (cmp !== 0) {
      return multiplier * cmp;
    }
    return right.bookedAt.getTime() - left.bookedAt.getTime();
  });
}

export interface BuildReviewSortHrefInput {
  filters: ReviewQueueFilters;
  field: ReviewSortField;
  buildHref: (nextFilters: ReviewQueueFilters, page?: number) => string;
  page?: number;
}

export function buildReviewSortHref(input: BuildReviewSortHrefInput): string {
  const current = parseReviewSort(input.filters);
  const nextDirection: ReviewSortDirection =
    current.field === input.field && current.direction === "desc" ? "asc" : "desc";
  return input.buildHref(
    { ...input.filters, sort: input.field, sortDir: nextDirection },
    input.page ?? 1,
  );
}
