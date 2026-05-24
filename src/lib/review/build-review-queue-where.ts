import type { Prisma } from "@prisma/client";

import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export function buildReviewQueueWhere(workspaceId: string): Prisma.TransactionWhereInput {
  return {
    workspaceId,
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
    return row.categoryName.trim().toLowerCase() !== normalized.trim().toLowerCase();
  }
  return false;
}
