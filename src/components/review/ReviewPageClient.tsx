"use client";

import { useState } from "react";

import { ReviewAiBatchButton } from "@/components/review/ReviewAiBatchButton";
import { ReviewQueueTable } from "@/components/review/ReviewQueueTable";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewPageClientProps {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  categories: CategoryOption[];
}

export function ReviewPageClient({
  items,
  total,
  page,
  categories,
}: ReviewPageClientProps): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<Record<string, MbankVerifySuggestion>>({});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {total > 0 ? (
            <>
              W kolejce: <strong>{String(total)}</strong> transakcji (strona {String(page)})
            </>
          ) : (
            "Kolejka pusta"
          )}
        </p>
        <ReviewAiBatchButton page={page} onSuggestions={setSuggestions} />
      </div>
      <ReviewQueueTable items={items} categories={categories} suggestions={suggestions} />
    </div>
  );
}
