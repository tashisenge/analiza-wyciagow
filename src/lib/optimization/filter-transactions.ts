import type { AccountContext, Prisma } from "@prisma/client";

import { shouldExcludeCategoryFromOptimization } from "@/lib/categories/canonical-categories";
import { prisma } from "@/lib/db";

export function isExcludedCategory(category: {
  name: string;
  excludeFromOptimization: boolean;
}): boolean {
  return shouldExcludeCategoryFromOptimization(category);
}

export async function dismissFixedCategoryOpportunities(workspaceId: string): Promise<number> {
  const open = await prisma.optimizationOpportunity.findMany({
    where: { workspaceId, status: "OPEN" },
    include: { category: true },
  });

  const toDismiss = open.filter(
    (opp) => opp.category && shouldExcludeCategoryFromOptimization(opp.category),
  );
  if (toDismiss.length === 0) {
    return 0;
  }

  await prisma.optimizationOpportunity.updateMany({
    where: { id: { in: toDismiss.map((o) => o.id) } },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
  return toDismiss.length;
}

export function optimizableTransactionsWhere(
  workspaceId: string,
  accountIds: string[],
  bookedAtGte: Date,
): Prisma.TransactionWhereInput {
  return {
    workspaceId,
    accountId: { in: accountIds },
    bookedAt: { gte: bookedAtGte },
    OR: [{ categoryId: null }, { category: { excludeFromOptimization: false } }],
  };
}

export function visibleOpenOpportunityWhere(
  workspaceId: string,
  context: AccountContext,
): Prisma.OptimizationOpportunityWhereInput {
  return {
    workspaceId,
    status: "OPEN",
    accountContext: context,
    OR: [{ categoryId: null }, { category: { excludeFromOptimization: false } }],
  };
}
