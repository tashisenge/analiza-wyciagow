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

export function isReviewReason(value: string | undefined): value is ReviewReason {
  return value != null && REVIEW_REASONS.has(value as ReviewReason);
}

export function parseReviewQueueFilters(params: ReviewSearchParams): ReviewQueueFilters {
  const context = (params.context ?? "razem") as ContextFilter;
  return {
    counterpartyContains: params.counterparty?.trim() || undefined,
    mbankCategory: params.mbankCategory?.trim() || undefined,
    uncategorizedOnly: params.uncategorized === "1",
    dateFrom: params.dateFrom?.trim() || undefined,
    dateTo: params.dateTo?.trim() || undefined,
    context: context === "razem" ? "razem" : context,
    reason: isReviewReason(params.reason) ? params.reason : undefined,
  };
}

export function appendReviewSearchParams(
  params: URLSearchParams,
  filters: ReviewQueueFilters,
  page?: number,
): void {
  if (page != null && page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  if (filters.context && filters.context !== "razem") {
    params.set("context", filters.context);
  } else {
    params.delete("context");
  }

  if (filters.counterpartyContains) {
    params.set("counterparty", filters.counterpartyContains);
  } else {
    params.delete("counterparty");
  }

  if (filters.mbankCategory) {
    params.set("mbankCategory", filters.mbankCategory);
  } else {
    params.delete("mbankCategory");
  }

  if (filters.uncategorizedOnly) {
    params.set("uncategorized", "1");
  } else {
    params.delete("uncategorized");
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  } else {
    params.delete("dateFrom");
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  } else {
    params.delete("dateTo");
  }

  if (filters.reason) {
    params.set("reason", filters.reason);
  } else {
    params.delete("reason");
  }
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
  return Boolean(
    filters.counterpartyContains ||
      filters.mbankCategory ||
      filters.uncategorizedOnly ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.reason ||
      (filters.context && filters.context !== "razem"),
  );
}
