"use client";

import { useEffect, useState } from "react";

import { ReviewAiBatchButton } from "@/components/review/ReviewAiBatchButton";
import { ReviewBulkPanel } from "@/components/review/ReviewBulkPanel";
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
  pageSize: number;
  filters: ReviewQueueFilters;
  categories: CategoryOption[];
}

function pageNumbers(current: number, totalPages: number): number[] {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
}

export function ReviewPageClient({
  items,
  total,
  page,
  pageSize,
  filters,
  categories,
}: ReviewPageClientProps): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<Record<string, MbankVerifySuggestion>>(
    {},
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [resolvedLocally, setResolvedLocally] = useState(0);

  const displayTotal = Math.max(0, total - resolvedLocally);
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  useEffect(() => {
    setResolvedLocally(0);
    setSelectedIds([]);
  }, [total, filters, page]);

  function toggleId(id: string): void {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id].slice(0, 500),
    );
  }

  function toggleSelectAll(visibleIds: string[]): void {
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])].slice(0, 500));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {displayTotal > 0 ? (
            <>
              W kolejce: <strong>{String(displayTotal)}</strong> transakcji (strona{" "}
              {String(page)} z {String(totalPages)}, po {String(pageSize)} na stronę)
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
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Paginacja">
          {page > 1 ? (
            <a href={buildReviewHref(filters, page - 1)} className="link-brand">
              ← Poprzednia
            </a>
          ) : null}
          {pageNumbers(page, totalPages).map((pageNumber) => (
            <a
              key={pageNumber}
              href={buildReviewHref(filters, pageNumber)}
              className={
                pageNumber === page
                  ? "rounded-full bg-brand-100 px-2.5 py-0.5 font-medium text-brand-800"
                  : "link-brand px-1"
              }
              aria-current={pageNumber === page ? "page" : undefined}
            >
              {String(pageNumber)}
            </a>
          ))}
          {page < totalPages ? (
            <a href={buildReviewHref(filters, page + 1)} className="link-brand">
              Następna →
            </a>
          ) : null}
        </nav>
      ) : null}

      <ReviewBulkPanel
        selectedIds={selectedIds}
        categories={categories}
        suggestions={suggestions}
        onClearSelection={() => {
          setSelectedIds([]);
        }}
        onResolved={() => {
          setResolvedLocally((count) => count + 1);
        }}
      />

      <ReviewQueueTable
        items={items}
        categories={categories}
        suggestions={suggestions}
        filters={filters}
        page={page}
        selectedIds={selectedIds}
        onToggleSelect={toggleId}
        onToggleSelectAll={toggleSelectAll}
        onResolved={() => {
          setResolvedLocally((count) => count + 1);
        }}
      />
    </div>
  );
}
