import { prisma } from "@/lib/db";
import { buildReviewQueueWhere } from "@/lib/review/build-review-queue-where";
import { mapReviewItems } from "@/lib/review/map-review-items";
import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";
import { resolveBulkAccountIds } from "@/lib/transactions/bulk-category-targets";

const REVIEW_PAGE_SIZE = 50;

type ReviewCandidateRow = Awaited<
  ReturnType<
    typeof prisma.transaction.findMany<{
      include: { category: { select: { name: true } } };
    }>
  >
>[number];

export interface ReviewQueueItem {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: string;
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}

async function fetchReviewCandidates(
  workspaceId: string,
  accountIds: string[],
  filters: ReviewQueueFilters,
): Promise<ReviewCandidateRow[]> {
  return prisma.transaction.findMany({
    where: buildReviewQueueWhere(workspaceId, accountIds, {
      counterpartyContains: filters.counterpartyContains,
      mbankCategory: filters.mbankCategory,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      uncategorizedOnly: filters.uncategorizedOnly,
    }),
    include: { category: { select: { name: true } } },
    orderBy: { bookedAt: "desc" },
  });
}

export async function loadReviewQueue(
  workspaceId: string,
  page = 1,
  filters: ReviewQueueFilters = {},
): Promise<{ items: ReviewQueueItem[]; total: number; page: number }> {
  const accountIds = await resolveBulkAccountIds(workspaceId, filters.context);
  const candidates = await fetchReviewCandidates(workspaceId, accountIds, filters);
  const filtered = mapReviewItems(candidates, filters.reason);
  const start = (page - 1) * REVIEW_PAGE_SIZE;

  return {
    items: filtered.slice(start, start + REVIEW_PAGE_SIZE),
    total: filtered.length,
    page,
  };
}

export async function countReviewQueue(workspaceId: string): Promise<number> {
  const { total } = await loadReviewQueue(workspaceId, 1);
  return total;
}
