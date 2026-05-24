import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";
import {
  bulkUpdateCategory,
  previewBulkCategoryUpdate,
  type BulkCategoryActionResult,
  type BulkPreviewActionResult,
} from "@/server/actions/bulk-category";

interface BuildFiltersInput {
  initialFilters: BulkCategoryFilters;
  counterpartyContains: string;
  mbankCategory: string;
  uncategorizedOnly: boolean;
}

export function buildCurrentBulkFilters(input: BuildFiltersInput): BulkCategoryFilters {
  return {
    ...input.initialFilters,
    counterpartyContains: input.counterpartyContains.trim() || undefined,
    mbankCategory: input.mbankCategory.trim() || undefined,
    uncategorizedOnly: input.uncategorizedOnly || undefined,
  };
}

export async function requestBulkPreview(
  filters: BulkCategoryFilters,
): Promise<BulkPreviewActionResult> {
  return previewBulkCategoryUpdate(filters);
}

interface BulkUpdateRequest {
  categoryId: string;
  rememberMerchant: boolean;
  selectedIds: string[];
  initialFilters: BulkCategoryFilters;
  currentFilters: BulkCategoryFilters;
}

export async function requestBulkUpdate(
  input: BulkUpdateRequest,
): Promise<BulkCategoryActionResult> {
  return bulkUpdateCategory({
    categoryId: input.categoryId,
    rememberMerchant: input.rememberMerchant,
    transactionIds: input.selectedIds.length > 0 ? input.selectedIds : undefined,
    filters: input.selectedIds.length > 0 ? input.initialFilters : input.currentFilters,
  });
}

export function formatBulkUpdateSuccess(
  result: Extract<BulkCategoryActionResult, { ok: true }>,
): string {
  const suffix =
    result.rememberedMerchants > 0
      ? ` (zapamiętano ${String(result.rememberedMerchants)} kontrahentów)`
      : "";
  return `Zaktualizowano ${String(result.updatedCount)} transakcji${suffix}`;
}
