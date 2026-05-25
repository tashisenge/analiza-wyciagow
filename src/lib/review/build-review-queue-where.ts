import type { Prisma } from "@prisma/client";

import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";
import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

function reviewQueueOrClause(): Prisma.TransactionWhereInput {
  return {
    OR: [
      { mbankCategory: { contains: "bez kategorii", mode: "insensitive" } },
      {
        AND: [{ categoryId: { not: null } }, { mbankCategory: { not: "" } }],
      },
      {
        AND: [
          { categoryId: null },
          { NOT: { mbankCategory: { in: ["", "Bez kategorii", "bez kategorii"] } } },
        ],
      },
    ],
  };
}

export function buildReviewQueueWhere(
  workspaceId: string,
  accountIds: string[],
  filters: Pick<
    BulkCategoryFilters,
    "counterpartyContains" | "mbankCategory" | "dateFrom" | "dateTo" | "uncategorizedOnly"
  > = {},
): Prisma.TransactionWhereInput {
  const scoped = buildBulkCategoryWhere({
    workspaceId,
    accountIds,
    filters,
  });

  return {
    AND: [
      { mbankReviewResolvedAt: null },
      reviewQueueOrClause(),
      scoped,
    ],
  };
}

export function isReviewRow(row: {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
  mbankReviewResolvedAt?: Date | null;
}): boolean {
  if (row.mbankReviewResolvedAt) {
    return false;
  }
  const normalized = normalizeMbankCategoryName(row.mbankCategory);
  if (row.mbankCategory.toLowerCase().includes("bez kategorii")) {
    return true;
  }
  if (normalized && !row.categoryId) {
    return true;
  }
  if (normalized && row.categoryName) {
    return row.categoryName.trim().toLowerCase() !== normalized.trim().toLowerCase();
  }
  return false;
}
