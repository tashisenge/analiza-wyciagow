import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { normalizeAmountForMatch } from "@/lib/transactions/normalize-amount-for-match";

const MAX_SIMILAR_UPDATES = 500;

export interface FindSimilarTransactionIdsOptions {
  prisma: PrismaClient;
  workspaceId: string;
  counterparty: string;
  excludeTransactionId: string;
  candidateTransactionIds: string[];
  onlyUncategorized: boolean;
  amount?: string | { toString(): string };
  currency?: string;
  matchSameAmount?: boolean;
}

function buildAmountFilter(amount: string | { toString(): string }): {
  OR: { amount: Prisma.Decimal }[];
} {
  const absValue = normalizeAmountForMatch(amount);
  const positive = new Prisma.Decimal(absValue);
  const negative = new Prisma.Decimal(`-${absValue}`);
  return { OR: [{ amount: positive }, { amount: negative }] };
}

function buildSimilarWhere(
  options: FindSimilarTransactionIdsOptions,
  counterparty: string,
): Prisma.TransactionWhereInput {
  return {
    workspaceId: options.workspaceId,
    id: {
      in: options.candidateTransactionIds,
      not: options.excludeTransactionId,
    },
    counterparty: { equals: counterparty, mode: "insensitive" },
    ...(options.matchSameAmount && options.amount
      ? buildAmountFilter(options.amount)
      : {}),
    ...(options.matchSameAmount && options.currency
      ? { currency: options.currency }
      : {}),
    ...(options.onlyUncategorized ? { categoryId: null } : {}),
  };
}

export async function findSimilarTransactionIds(
  options: FindSimilarTransactionIdsOptions,
): Promise<string[]> {
  const trimmed = options.counterparty.trim();
  if (!trimmed || options.candidateTransactionIds.length === 0) {
    return [];
  }

  const rows = await options.prisma.transaction.findMany({
    where: buildSimilarWhere(options, trimmed),
    select: { id: true },
    take: MAX_SIMILAR_UPDATES,
  });

  return rows.map((row) => row.id);
}
