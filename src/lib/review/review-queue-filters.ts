import type { AccountContext } from "@prisma/client";

import type { ContextFilter } from "@/lib/analytics/filters";
import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export type ReviewReason = "mbank_uncategorized" | "name_mismatch" | "app_missing";

export interface ReviewQueueFilters {
  counterpartyContains?: string;
  mbankCategory?: string;
  uncategorizedOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  context?: AccountContext;
  reason?: ReviewReason;
}

export interface ReviewSearchParams {
  page?: string;
  context?: string;
  counterparty?: string;
  mbankCategory?: string;
  uncategorized?: string;
  dateFrom?: string;
  dateTo?: string;
  reason?: string;
}

const REVIEW_REASONS = new Set<ReviewReason>([
  "mbank_uncategorized",
  "name_mismatch",
  "app_missing",
]);

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}

function parseContextFilter(value: string | undefined): ContextFilter {
  const context = (value ?? "razem") as ContextFilter;
  return context === "razem" ? "razem" : context;
}

function setOptionalSearchParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function setPageParam(params: URLSearchParams, page?: number): void {
  if (page != null && page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
}

function appendReviewFilterParams(
  params: URLSearchParams,
  filters: ReviewQueueFilters,
): void {
  if (filters.context && filters.context !== "razem") {
    params.set("context", filters.context);
  } else {
    params.delete("context");
  }

  setOptionalSearchParam(params, "counterparty", filters.counterpartyContains);
  setOptionalSearchParam(params, "mbankCategory", filters.mbankCategory);

  if (filters.uncategorizedOnly) {
    params.set("uncategorized", "1");
  } else {
    params.delete("uncategorized");
  }

  setOptionalSearchParam(params, "dateFrom", filters.dateFrom);
  setOptionalSearchParam(params, "dateTo", filters.dateTo);
  setOptionalSearchParam(params, "reason", filters.reason);
}

export function isReviewReason(value: string | undefined): value is ReviewReason {
  return value != null && REVIEW_REASONS.has(value as ReviewReason);
}

export function parseReviewQueueFilters(params: ReviewSearchParams): ReviewQueueFilters {
  return {
    counterpartyContains: trimOrUndefined(params.counterparty),
    mbankCategory: trimOrUndefined(params.mbankCategory),
    uncategorizedOnly: params.uncategorized === "1",
    dateFrom: trimOrUndefined(params.dateFrom),
    dateTo: trimOrUndefined(params.dateTo),
    context: parseContextFilter(params.context),
    reason: isReviewReason(params.reason) ? params.reason : undefined,
  };
}

export function appendReviewSearchParams(
  params: URLSearchParams,
  filters: ReviewQueueFilters,
  page?: number,
): void {
  setPageParam(params, page);
  appendReviewFilterParams(params, filters);
}

export function buildReviewHref(filters: ReviewQueueFilters, page = 1): string {
  const params = new URLSearchParams();
  appendReviewSearchParams(params, filters, page);
  const query = params.toString();
  return query ? `/review?${query}` : "/review";
}

export function getReviewReason(row: {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}): ReviewReason {
  if (row.mbankCategory.toLowerCase().includes("bez kategorii")) {
    return "mbank_uncategorized";
  }

  const normalized = normalizeMbankCategoryName(row.mbankCategory);
  if (normalized && !row.categoryId) {
    return "app_missing";
  }

  return "name_mismatch";
}

export function hasActiveReviewFilters(filters: ReviewQueueFilters): boolean {
  return (
    trimOrUndefined(filters.counterpartyContains) != null ||
    trimOrUndefined(filters.mbankCategory) != null ||
    filters.uncategorizedOnly === true ||
    trimOrUndefined(filters.dateFrom) != null ||
    trimOrUndefined(filters.dateTo) != null ||
    filters.reason != null ||
    (filters.context != null && filters.context !== "razem")
  );
}
