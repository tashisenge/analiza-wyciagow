import type { PrismaClient } from "@prisma/client";

const MAX_SIMILAR_UPDATES = 500;

export interface FindSimilarTransactionIdsOptions {
  prisma: PrismaClient;
  workspaceId: string;
  counterparty: string;
  excludeTransactionId: string;
  onlyUncategorized: boolean;
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
      ...(options.onlyUncategorized ? { categoryId: null } : {}),
    },
    select: { id: true },
    take: MAX_SIMILAR_UPDATES,
  });

  return rows.map((row) => row.id);
}
