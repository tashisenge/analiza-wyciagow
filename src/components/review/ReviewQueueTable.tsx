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

interface RowMessage {
  type: "success" | "error";
  text: string;
}

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
  categories: CategoryOption[];
  suggestions: Record<string, MbankVerifySuggestion>;
  onResolved?: () => void;
}

function clearRowMessage(
  transactionId: string,
  setRowMessages: React.Dispatch<React.SetStateAction<Record<string, RowMessage>>>,
): void {
  setRowMessages((prev) => {
    if (!(transactionId in prev)) {
      return prev;
    }
    const { [transactionId]: _removed, ...rest } = prev;
    return rest;
  });
}

export function ReviewQueueTable({
  items,
  categories,
  suggestions,
  onResolved,
}: ReviewQueueTableProps): React.JSX.Element {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [rowMessages, setRowMessages] = useState<Record<string, RowMessage>>({});
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [customCategoryByTx, setCustomCategoryByTx] = useState<Record<string, string>>(
    {},
  );
  const [, startTransition] = useTransition();

  function showBanner(type: "success" | "error", text: string): void {
    setBanner({ type, text });
    window.setTimeout(() => {
      setBanner(null);
    }, 3000);
  }

  function runDecision(
    transactionId: string,
    decision: "mbank" | "app" | "custom" | "skip",
    categoryId?: string,
  ): void {
    setError(null);
    setBanner(null);
    clearRowMessage(transactionId, setRowMessages);
    setPendingId(transactionId);

    startTransition(async () => {
      const result = await applyReviewDecision({ transactionId, decision, categoryId });
      setPendingId(null);

      if (!result.ok) {
        setError(result.error);
        showBanner("error", result.error);
        setRowMessages((prev) => ({
          ...prev,
          [transactionId]: { type: "error", text: result.error },
        }));
        return;
      }

      if (decision === "skip") {
        setRowMessages((prev) => ({
          ...prev,
          [transactionId]: { type: "success", text: result.message },
        }));
        showBanner("success", result.message);
        window.setTimeout(() => {
          clearRowMessage(transactionId, setRowMessages);
        }, 3000);
        return;
      }

      setHiddenIds((prev) => new Set(prev).add(transactionId));
      onResolved?.();
      showBanner("success", "Zapisano — usunięto z kolejki weryfikacji");
      router.refresh();
    });
  }

  function reportError(message: string): void {
    setError(message);
    showBanner("error", message);
  }

  const visibleItems = items.filter((item) => !hiddenIds.has(item.id));

  if (visibleItems.length === 0) {
    return (
      <p className="section-card p-6 text-center text-slate-600">
        Brak transakcji do weryfikacji — kategorie mBank i app są spójne.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {banner ? (
        <p
          className={banner.type === "success" ? "alert-success text-sm" : "alert-error text-sm"}
          role="status"
        >
          {banner.text}
        </p>
      ) : null}
      {error && !banner ? <p className="alert-error text-sm">{error}</p> : null}
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
            {visibleItems.map((item) => (
              <ReviewQueueRow
                key={item.id}
                item={item}
                suggestion={suggestions[item.id]}
                categories={categories}
                customCategoryId={customCategoryByTx[item.id] ?? ""}
                pending={pendingId === item.id}
                rowMessage={rowMessages[item.id]}
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
