"use client";

import { useCallback } from "react";

import { useBulkCategoryFormState } from "@/components/transactions/use-bulk-category-form-state";
import { useBulkPreviewAction } from "@/components/transactions/use-bulk-preview-action";
import { useBulkUpdateAction } from "@/components/transactions/use-bulk-update-action";
import { buildCurrentBulkFilters } from "@/lib/transactions/bulk-category-client";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

interface UseBulkCategoryPanelInput {
  initialFilters: BulkCategoryFilters;
  selectedIds: string[];
}

interface UseBulkCategoryPanelReturn {
  categoryId: string;
  rememberMerchant: boolean;
  counterpartyContains: string;
  mbankCategory: string;
  uncategorizedOnly: boolean;
  setCategoryId: (value: string) => void;
  setRememberMerchant: (value: boolean) => void;
  setCounterpartyContains: (value: string) => void;
  setMbankCategory: (value: string) => void;
  setUncategorizedOnly: (value: boolean) => void;
  pending: boolean;
  previewCount: number | null;
  previewCapped: boolean;
  error: string | null;
  success: string | null;
  runPreview: () => void;
  runBulkUpdate: () => void;
}

export function useBulkCategoryPanel({
  initialFilters,
  selectedIds,
}: UseBulkCategoryPanelInput): UseBulkCategoryPanelReturn {
  const form = useBulkCategoryFormState(initialFilters);
  const getFilters = useCallback(
    () =>
      buildCurrentBulkFilters({
        initialFilters,
        counterpartyContains: form.counterpartyContains,
        mbankCategory: form.mbankCategory,
        uncategorizedOnly: form.uncategorizedOnly,
      }),
    [
      initialFilters,
      form.counterpartyContains,
      form.mbankCategory,
      form.uncategorizedOnly,
    ],
  );

  const preview = useBulkPreviewAction(getFilters);
  const update = useBulkUpdateAction({
    initialFilters,
    selectedIds,
    categoryId: form.categoryId,
    rememberMerchant: form.rememberMerchant,
    counterpartyContains: form.counterpartyContains,
    mbankCategory: form.mbankCategory,
    uncategorizedOnly: form.uncategorizedOnly,
    onPreviewReset: preview.resetPreview,
  });

  return {
    ...form,
    pending: preview.pending || update.pending,
    previewCount: preview.previewCount,
    previewCapped: preview.previewCapped,
    error: preview.error ?? update.error,
    success: update.success,
    runPreview: preview.runPreview,
    runBulkUpdate: update.runBulkUpdate,
  };
}
