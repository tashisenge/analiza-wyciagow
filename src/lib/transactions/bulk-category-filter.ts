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

function applyCounterpartyFilter(
  where: Prisma.TransactionWhereInput,
  counterpartyContains?: string,
): void {
  if (!counterpartyContains?.trim()) {
    return;
  }
  where.counterparty = {
    contains: counterpartyContains.trim(),
    mode: "insensitive",
  };
}

function applyMbankCategoryFilter(
  where: Prisma.TransactionWhereInput,
  mbankCategory?: string,
): void {
  if (!mbankCategory?.trim()) {
    return;
  }
  where.mbankCategory = {
    equals: mbankCategory.trim(),
    mode: "insensitive",
  };
}

function applyDateRangeFilter(
  where: Prisma.TransactionWhereInput,
  dateFrom?: string,
  dateTo?: string,
): void {
  if (!dateFrom && !dateTo) {
    return;
  }
  where.bookedAt = {};
  if (dateFrom) {
    where.bookedAt.gte = parseDateStart(dateFrom);
  }
  if (dateTo) {
    where.bookedAt.lte = parseDateEnd(dateTo);
  }
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

  applyCounterpartyFilter(where, filters.counterpartyContains);
  applyMbankCategoryFilter(where, filters.mbankCategory);

  if (filters.uncategorizedOnly) {
    where.categoryId = null;
  }

  applyDateRangeFilter(where, filters.dateFrom, filters.dateTo);

  return where;
}
