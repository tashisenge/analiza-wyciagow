import type { Prisma } from "@prisma/client";

import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";
import { mapMbankCategoryToAppName } from "@/lib/mbank-category-map";
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
    AND: [reviewQueueOrClause(), scoped],
  };
}

export function isReviewRow(row: {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}): boolean {
  const normalized = normalizeMbankCategoryName(row.mbankCategory);
  if (row.mbankCategory.toLowerCase().includes("bez kategorii")) {
    return true;
  }
  if (normalized && !row.categoryId) {
    return true;
  }
  if (normalized && row.categoryName) {
    const expectedAppName = mapMbankCategoryToAppName(normalized);
    return (
      row.categoryName.trim().toLowerCase() !== expectedAppName?.trim().toLowerCase()
    );
  }
  return false;
}
