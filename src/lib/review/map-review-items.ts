import { isReviewRow } from "@/lib/review/build-review-queue-where";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import { getReviewReason, type ReviewReason } from "@/lib/review/review-queue-filters";

interface ReviewCandidate {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString(): string };
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  category: { name: string } | null;
}

function toReviewItem(tx: ReviewCandidate): ReviewQueueItem {
  return {
    id: tx.id,
    bookedAt: tx.bookedAt,
    counterparty: tx.counterparty,
    description: tx.description,
    amount: tx.amount.toString(),
    currency: tx.currency,
    mbankCategory: tx.mbankCategory,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
  };
}

export function mapReviewItems(
  candidates: ReviewCandidate[],
  reason?: ReviewReason,
): ReviewQueueItem[] {
  return candidates
    .filter((tx) =>
      isReviewRow({
        mbankCategory: tx.mbankCategory,
        categoryId: tx.categoryId,
        categoryName: tx.category?.name ?? null,
      }),
    )
    .filter((tx) => {
      if (!reason) {
        return true;
      }
      return (
        getReviewReason({
          mbankCategory: tx.mbankCategory,
          categoryId: tx.categoryId,
          categoryName: tx.category?.name ?? null,
        }) === reason
      );
    })
    .map(toReviewItem);
}
