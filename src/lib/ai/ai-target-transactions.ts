import type { Prisma, Transaction } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Nazwy kubełka „Bez kategorii” w aplikacji (nie pole mBank). */
export const AI_UNCATEGORIZED_CATEGORY_NAMES = [
  "Bez kategorii",
  "bez kategorii",
  "Bez kategorii mBank",
] as const;

/**
 * Transakcje kwalifikujące się do kategoryzacji AI: brak categoryId albo
 * kubełek app «Bez kategorii». Nie używaj mbankCategory — użytkownik mógł
 * już ręcznie przypisać sensowną kategorię przy mBank „Bez kategorii”.
 */
export function buildAiUncategorizedWhere(
  workspaceId: string,
  bezCategoryIds: string[],
): Prisma.TransactionWhereInput {
  return {
    workspaceId,
    OR: [
      { categoryId: null },
      ...(bezCategoryIds.length > 0 ? [{ categoryId: { in: bezCategoryIds } }] : []),
    ],
  };
}

async function loadBezKategoriiIds(workspaceId: string): Promise<string[]> {
  const bezKategorii = await prisma.category.findMany({
    where: {
      workspaceId,
      name: { in: [...AI_UNCATEGORIZED_CATEGORY_NAMES] },
    },
    select: { id: true },
  });
  return bezKategorii.map((category) => category.id);
}

async function buildAiTargetWhere(
  workspaceId: string,
): Promise<Prisma.TransactionWhereInput> {
  const bezIds = await loadBezKategoriiIds(workspaceId);
  return buildAiUncategorizedWhere(workspaceId, bezIds);
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
