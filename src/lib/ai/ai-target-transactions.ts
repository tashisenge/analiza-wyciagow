import type { Prisma, Transaction } from "@prisma/client";

import { prisma } from "@/lib/db";

async function buildAiTargetWhere(
  workspaceId: string,
): Promise<Prisma.TransactionWhereInput> {
  const bezKategorii = await prisma.category.findMany({
    where: {
      workspaceId,
      name: { in: ["Bez kategorii", "bez kategorii", "Bez kategorii mBank"] },
    },
    select: { id: true },
  });
  const bezIds = bezKategorii.map((category) => category.id);

  return {
    workspaceId,
    OR: [
      { categoryId: null },
      ...(bezIds.length > 0 ? [{ categoryId: { in: bezIds } }] : []),
      { mbankCategory: { contains: "bez kategorii", mode: "insensitive" } },
    ],
  };
}

export interface AiCategorizationTargets {
  transactions: Transaction[];
  count: number;
}

/** Transakcje kwalifikujące się do kategoryzacji AI (brak kategorii lub kubełek „Bez kategorii”). */
export async function findAiCategorizationTargets(
  workspaceId: string,
  limit = 100,
): Promise<AiCategorizationTargets> {
  const where = await buildAiTargetWhere(workspaceId);

  const [transactions, count] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: { bookedAt: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, count };
}

export async function countAiCategorizationTargets(workspaceId: string): Promise<number> {
  const where = await buildAiTargetWhere(workspaceId);
  return prisma.transaction.count({ where });
}
