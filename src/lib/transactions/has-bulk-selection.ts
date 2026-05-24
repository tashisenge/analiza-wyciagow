import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

export function hasBulkSelection(
  transactionIds: string[] | undefined,
  filters: BulkCategoryFilters,
): boolean {
  return [
    (transactionIds?.length ?? 0) > 0,
    Boolean(filters.counterpartyContains?.trim()),
    Boolean(filters.mbankCategory?.trim()),
    Boolean(filters.uncategorizedOnly),
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
  ].some(Boolean);
}
