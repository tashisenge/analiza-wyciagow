"use client";

import { useEffect, useState } from "react";

import { ReviewAiBatchButton } from "@/components/review/ReviewAiBatchButton";
import { ReviewQueueTable } from "@/components/review/ReviewQueueTable";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import {
  buildReviewHref,
  type ReviewQueueFilters,
} from "@/lib/review/review-queue-filters";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewPageClientProps {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  filters: ReviewQueueFilters;
  categories: CategoryOption[];
}

export function ReviewPageClient({
  items,
  total,
  page,
  filters,
  categories,
}: ReviewPageClientProps): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<Record<string, MbankVerifySuggestion>>(
    {},
  );
  const [resolvedLocally, setResolvedLocally] = useState(0);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total - resolvedLocally) / pageSize));
  const displayTotal = Math.max(0, total - resolvedLocally);

  useEffect(() => {
    setResolvedLocally(0);
  }, [total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {displayTotal > 0 ? (
            <>
              W kolejce: <strong>{String(displayTotal)}</strong> transakcji (strona{" "}
              {String(page)} z {String(totalPages)})
            </>
          ) : (
            "Kolejka pusta dla wybranych filtrów"
          )}
        </p>
        <ReviewAiBatchButton
          page={page}
          filters={filters}
          onSuggestions={setSuggestions}
        />
      </div>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {page > 1 ? (
            <a href={buildReviewHref(filters, page - 1)} className="link-brand">
              ← Poprzednia
            </a>
          ) : null}
          {page < totalPages ? (
            <a href={buildReviewHref(filters, page + 1)} className="link-brand">
              Następna →
            </a>
          ) : null}
        </div>
      ) : null}
      <ReviewQueueTable
        items={items}
        categories={categories}
        suggestions={suggestions}
        onResolved={() => {
          setResolvedLocally((count) => count + 1);
        }}
      />
    </div>
  );
}
