import { prisma } from "@/lib/db";
import { buildReviewQueueWhere } from "@/lib/review/build-review-queue-where";
import { mapReviewItems } from "@/lib/review/map-review-items";
import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";
import {
  buildReviewOrderBy,
  parseReviewSort,
  sortReviewItems,
} from "@/lib/review/review-sort";
import { resolveBulkAccountIds } from "@/lib/transactions/bulk-category-targets";

export const REVIEW_PAGE_SIZE = 50;
const REVIEW_SCAN_BATCH = 250;
const REVIEW_MAX_SCAN = 10_000;

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

function toDbFilters(filters: ReviewQueueFilters): {
  counterpartyContains?: string;
  mbankCategory?: string;
  descriptionContains?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  uncategorizedOnly?: boolean;
  context?: ReviewQueueFilters["context"];
} {
  return {
    counterpartyContains: filters.counterpartyContains,
    mbankCategory: filters.mbankCategory,
    descriptionContains: filters.descriptionContains,
    categoryId: filters.categoryId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    uncategorizedOnly: filters.uncategorizedOnly,
    context: filters.context,
  };
}

interface FetchBatchInput {
  workspaceId: string;
  accountIds: string[];
  filters: ReviewQueueFilters;
  skip: number;
}

async function fetchReviewBatch(input: FetchBatchInput): Promise<ReviewCandidateRow[]> {
  const sort = parseReviewSort(input.filters);
  return prisma.transaction.findMany({
    where: buildReviewQueueWhere(
      input.workspaceId,
      input.accountIds,
      toDbFilters(input.filters),
    ),
    include: { category: { select: { name: true } } },
    orderBy: buildReviewOrderBy(sort),
    take: REVIEW_SCAN_BATCH,
    skip: input.skip,
  });
}

async function collectReviewItems(
  workspaceId: string,
  accountIds: string[],
  filters: ReviewQueueFilters,
): Promise<ReviewQueueItem[]> {
  const collected: ReviewQueueItem[] = [];
  let dbSkip = 0;

  while (dbSkip < REVIEW_MAX_SCAN) {
    const batch = await fetchReviewBatch({
      workspaceId,
      accountIds,
      filters,
      skip: dbSkip,
    });
    if (batch.length === 0) {
      break;
    }
    collected.push(...mapReviewItems(batch, filters.reason));
    dbSkip += batch.length;
    if (batch.length < REVIEW_SCAN_BATCH) {
      break;
    }
  }

  return sortReviewItems(collected, parseReviewSort(filters));
}

export async function loadReviewQueue(
  workspaceId: string,
  page = 1,
  filters: ReviewQueueFilters = {},
): Promise<{ items: ReviewQueueItem[]; total: number; page: number; pageSize: number }> {
  const accountIds = await resolveBulkAccountIds(workspaceId, filters.context);
  const allItems = await collectReviewItems(workspaceId, accountIds, filters);
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * REVIEW_PAGE_SIZE;

  return {
    items: allItems.slice(start, start + REVIEW_PAGE_SIZE),
    total: allItems.length,
    page: safePage,
    pageSize: REVIEW_PAGE_SIZE,
  };
}

export async function countReviewQueue(
  workspaceId: string,
  filters: ReviewQueueFilters = {},
): Promise<number> {
  const { total } = await loadReviewQueue(workspaceId, 1, filters);
  return total;
}
