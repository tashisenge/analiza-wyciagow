import type { AccountContext } from "@prisma/client";

import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";

export function sixMonthsAgo(anchor: Date): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() - 6, 1);
}

export async function fetchAccountIds(
  workspaceId: string,
  context: ContextFilter,
): Promise<string[]> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  return accountIdsForContext(accounts, context);
}

function toAccountContext(context: ContextFilter): AccountContext {
  return context;
}

export async function fetchBudgetsForContext(
  workspaceId: string,
  context: ContextFilter,
): Promise<
  Awaited<
    ReturnType<typeof prisma.categoryBudget.findMany<{ include: { category: true } }>>
  >
> {
  return prisma.categoryBudget.findMany({
    where: { workspaceId, accountContext: toAccountContext(context) },
    include: { category: true },
  });
}
