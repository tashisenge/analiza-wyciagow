import { isReviewRow } from "@/lib/review/build-review-queue-where";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

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

export function mapReviewItems(candidates: ReviewCandidate[]): ReviewQueueItem[] {
  return candidates
    .filter((tx) =>
      isReviewRow({
        mbankCategory: tx.mbankCategory,
        categoryId: tx.categoryId,
        categoryName: tx.category?.name ?? null,
      }),
    )
    .map(toReviewItem);
}
