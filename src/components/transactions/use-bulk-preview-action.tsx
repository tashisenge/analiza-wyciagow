"use client";

import { useState, useTransition } from "react";

import { requestBulkPreview } from "@/lib/transactions/bulk-category-client";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

export function useBulkPreviewAction(getFilters: () => BulkCategoryFilters): {
  pending: boolean;
  previewCount: number | null;
  previewCapped: boolean;
  error: string | null;
  runPreview: () => void;
  setError: (value: string | null) => void;
  resetPreview: () => void;
} {
  const [pending, startTransition] = useTransition();
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCapped, setPreviewCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runPreview(): void {
    setError(null);
    startTransition(async () => {
      const result = await requestBulkPreview(getFilters());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreviewCount(result.preview.count);
      setPreviewCapped(result.preview.capped);
    });
  }

  return {
    pending,
    previewCount,
    previewCapped,
    error,
    runPreview,
    setError,
    resetPreview: (): void => {
      setPreviewCount(null);
      setPreviewCapped(false);
    },
  };
}
