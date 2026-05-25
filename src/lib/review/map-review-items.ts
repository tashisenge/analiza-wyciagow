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
  mbankReviewResolvedAt: Date | null;
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

function reviewRowFromCandidate(tx: ReviewCandidate): {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
  mbankReviewResolvedAt: Date | null;
} {
  return {
    mbankCategory: tx.mbankCategory,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
    mbankReviewResolvedAt: tx.mbankReviewResolvedAt,
  };
}

function matchesReviewReason(tx: ReviewCandidate, reason?: ReviewReason): boolean {
  if (!reason) {
    return true;
  }
  return getReviewReason(reviewRowFromCandidate(tx)) === reason;
}

export function mapReviewItems(
  candidates: ReviewCandidate[],
  reason?: ReviewReason,
): ReviewQueueItem[] {
  return candidates
    .filter((tx) => isReviewRow(reviewRowFromCandidate(tx)))
    .filter((tx) => matchesReviewReason(tx, reason))
    .map(toReviewItem);
}
