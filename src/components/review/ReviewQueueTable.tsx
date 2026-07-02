"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ReviewQueueBanner } from "@/components/review/ReviewQueueBanner";
import { ReviewQueueRow } from "@/components/review/ReviewQueueRow";
import { ReviewQueueTableHead } from "@/components/review/ReviewQueueTableHead";
import { startReviewDecision } from "@/components/review/start-review-decision";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";

interface CategoryOption {
  id: string;
  name: string;
}

interface RowMessage {
  type: "success" | "error";
  text: string;
}

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
  categories: CategoryOption[];
  suggestions: Record<string, MbankVerifySuggestion>;
  filters: ReviewQueueFilters;
  page: number;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onResolved?: () => void;
}

export function ReviewQueueTable({
  items,
  categories,
  suggestions,
  filters,
  page,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onResolved,
}: ReviewQueueTableProps): React.JSX.Element {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [rowMessages, setRowMessages] = useState<Record<string, RowMessage>>({});
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customCategoryByTx, setCustomCategoryByTx] = useState<Record<string, string>>(
    {},
  );
  const [, startTransition] = useTransition();

  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.has(item.id)),
    [items, hiddenIds],
  );
  const visibleIds = useMemo(() => visibleItems.map((item) => item.id), [visibleItems]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function showBanner(type: "success" | "error", text: string): void {
    setBanner({ type, text });
    window.setTimeout(() => {
      setBanner(null);
    }, 3000);
  }

  function clearRowMessage(transactionId: string): void {
    setRowMessages((prev) => {
      if (!(transactionId in prev)) {
        return prev;
      }
      const { [transactionId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function runDecision(
    transactionId: string,
    decision: "mbank" | "app" | "custom" | "skip",
    categoryId?: string,
  ): void {
    startTransition(() => {
      startReviewDecision({
        transactionId,
        decision,
        categoryId,
        router,
        onResolved,
        setPendingId,
        setError,
        setBanner,
        setRowMessages,
        setHiddenIds,
        clearRowMessage,
        showBanner,
      });
    });
  }

  function reportError(message: string): void {
    setError(message);
    showBanner("error", message);
  }

  if (visibleItems.length === 0) {
    return (
      <p className="section-card p-6 text-center text-slate-600">
        Brak transakcji do weryfikacji — kategorie mBank i app są spójne.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ReviewQueueBanner banner={banner} error={error} />
      <div className="section-card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <ReviewQueueTableHead
            showSelection
            filters={filters}
            page={page}
            allSelected={allVisibleSelected}
            onToggleSelectAll={() => {
              onToggleSelectAll(visibleIds);
            }}
          />
          <tbody>
            {visibleItems.map((item) => (
              <ReviewQueueRow
                key={item.id}
                item={item}
                suggestion={suggestions[item.id]}
                categories={categories}
                customCategoryId={customCategoryByTx[item.id] ?? ""}
                pending={pendingId === item.id}
                selected={selectedIds.includes(item.id)}
                showSelection
                rowMessage={rowMessages[item.id]}
                onToggleSelect={onToggleSelect}
                onCustomCategoryChange={(categoryId) => {
                  setCustomCategoryByTx((prev) => ({ ...prev, [item.id]: categoryId }));
                }}
                onDecision={runDecision}
                onError={reportError}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
