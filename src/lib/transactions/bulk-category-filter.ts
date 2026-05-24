import type { Prisma } from "@prisma/client";

import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

export interface BuildBulkCategoryWhereInput {
  workspaceId: string;
  accountIds: string[];
  filters: BulkCategoryFilters;
  transactionIds?: string[];
}

function parseDateStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function parseDateEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

export function buildBulkCategoryWhere(
  input: BuildBulkCategoryWhereInput,
): Prisma.TransactionWhereInput {
  const { workspaceId, accountIds, filters, transactionIds } = input;

  const where: Prisma.TransactionWhereInput = {
    workspaceId,
    accountId: { in: accountIds },
  };

  if (transactionIds && transactionIds.length > 0) {
    where.id = { in: transactionIds };
  }

  if (filters.counterpartyContains?.trim()) {
    where.counterparty = {
      contains: filters.counterpartyContains.trim(),
      mode: "insensitive",
    };
  }

  if (filters.mbankCategory?.trim()) {
    where.mbankCategory = {
      equals: filters.mbankCategory.trim(),
      mode: "insensitive",
    };
  }

  if (filters.uncategorizedOnly) {
    where.categoryId = null;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.bookedAt = {};
    if (filters.dateFrom) {
      where.bookedAt.gte = parseDateStart(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.bookedAt.lte = parseDateEnd(filters.dateTo);
    }
  }

  return where;
}
