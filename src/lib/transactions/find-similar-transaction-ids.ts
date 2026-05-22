import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { normalizeAmountForMatch } from "@/lib/transactions/normalize-amount-for-match";

const MAX_SIMILAR_UPDATES = 500;

export interface FindSimilarTransactionIdsOptions {
  prisma: PrismaClient;
  workspaceId: string;
  counterparty: string;
  excludeTransactionId: string;
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

export async function findSimilarTransactionIds(
  options: FindSimilarTransactionIdsOptions,
): Promise<string[]> {
  const trimmed = options.counterparty.trim();
  if (!trimmed) {
    return [];
  }

  const rows = await options.prisma.transaction.findMany({
    where: {
      workspaceId: options.workspaceId,
      id: { not: options.excludeTransactionId },
      counterparty: { equals: trimmed, mode: "insensitive" },
      ...(options.matchSameAmount && options.amount
        ? buildAmountFilter(options.amount)
        : {}),
      ...(options.matchSameAmount && options.currency
        ? { currency: options.currency }
        : {}),
      ...(options.onlyUncategorized ? { categoryId: null } : {}),
    },
    select: { id: true },
    take: MAX_SIMILAR_UPDATES,
  });

  return rows.map((row) => row.id);
}
