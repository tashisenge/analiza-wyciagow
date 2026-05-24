import type { Prisma } from "@prisma/client";

import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

export function transactionListExtraWhere(
  params: TransactionSearchParams,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};

  if (params.mbankCategory) {
    where.mbankCategory = {
      equals: params.mbankCategory,
      mode: "insensitive",
    };
  }

  if (params.dateFrom || params.dateTo) {
    where.bookedAt = {
      ...(params.dateFrom ? { gte: new Date(`${params.dateFrom}T00:00:00.000Z`) } : {}),
      ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  return where;
}
