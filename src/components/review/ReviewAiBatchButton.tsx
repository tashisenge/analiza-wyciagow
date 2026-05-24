"use client";

import { useState, useTransition } from "react";

import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";
import { aiVerifyReviewBatch } from "@/server/actions/review";

export function ReviewAiBatchButton({
  page,
  filters,
  onSuggestions,
}: {
  page: number;
  filters: ReviewQueueFilters;
  onSuggestions: (suggestions: Record<string, MbankVerifySuggestion>) => void;
}): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(): void {
    setError(null);
    startTransition(async () => {
      const result = await aiVerifyReviewBatch(page, filters);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuggestions(result.suggestions);
    });
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={run} disabled={pending} className="btn-primary text-sm">
        {pending ? "Weryfikuję…" : "Zweryfikuj 50 z AI"}
      </button>
      {error ? <p className="alert-error text-sm">{error}</p> : null}
    </div>
  );
}
