"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ReviewQueueRow } from "@/components/review/ReviewQueueRow";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import { applyReviewDecision } from "@/server/actions/review";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
  categories: CategoryOption[];
  suggestions: Record<string, MbankVerifySuggestion>;
}

export function ReviewQueueTable({
  items,
  categories,
  suggestions,
}: ReviewQueueTableProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customCategoryByTx, setCustomCategoryByTx] = useState<Record<string, string>>({});

  function runDecision(
    transactionId: string,
    decision: "mbank" | "app" | "custom" | "skip",
    categoryId?: string,
  ): void {
    setError(null);
    startTransition(async () => {
      const result = await applyReviewDecision({ transactionId, decision, categoryId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="section-card p-6 text-center text-slate-600">
        Brak transakcji do weryfikacji — kategorie mBank i app są spójne.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="alert-error text-sm">{error}</p> : null}
      <div className="section-card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-calm-200 bg-calm-50">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Operacja</th>
              <th className="px-3 py-2">mBank</th>
              <th className="px-3 py-2">App</th>
              <th className="px-3 py-2">Sugestia AI</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ReviewQueueRow
                key={item.id}
                item={item}
                suggestion={suggestions[item.id]}
                categories={categories}
                customCategoryId={customCategoryByTx[item.id] ?? ""}
                pending={pending}
                onCustomCategoryChange={(categoryId) => {
                  setCustomCategoryByTx((prev) => ({ ...prev, [item.id]: categoryId }));
                }}
                onDecision={runDecision}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
