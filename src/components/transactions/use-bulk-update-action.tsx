"use client";

import { useState, useTransition } from "react";

import {
  buildCurrentBulkFilters,
  formatBulkUpdateSuccess,
  requestBulkUpdate,
} from "@/lib/transactions/bulk-category-client";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

interface BulkUpdateActionInput {
  initialFilters: BulkCategoryFilters;
  selectedIds: string[];
  categoryId: string;
  rememberMerchant: boolean;
  counterpartyContains: string;
  mbankCategory: string;
  uncategorizedOnly: boolean;
  onPreviewReset: () => void;
}

export function useBulkUpdateAction(input: BulkUpdateActionInput): {
  pending: boolean;
  success: string | null;
  error: string | null;
  runBulkUpdate: () => void;
  setError: (value: string | null) => void;
} {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runBulkUpdate(): void {
    setError(null);
    setSuccess(null);
    if (!input.categoryId) {
      setError("Wybierz kategorię docelową");
      return;
    }
    startTransition(async () => {
      const result = await requestBulkUpdate({
        categoryId: input.categoryId,
        rememberMerchant: input.rememberMerchant,
        selectedIds: input.selectedIds,
        initialFilters: input.initialFilters,
        currentFilters: buildCurrentBulkFilters({
          initialFilters: input.initialFilters,
          counterpartyContains: input.counterpartyContains,
          mbankCategory: input.mbankCategory,
          uncategorizedOnly: input.uncategorizedOnly,
        }),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(formatBulkUpdateSuccess(result));
      input.onPreviewReset();
    });
  }

  return { pending, success, error, runBulkUpdate, setError };
}
