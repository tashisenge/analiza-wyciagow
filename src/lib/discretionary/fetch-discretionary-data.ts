import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";

export function fetchDiscretionaryTransactions(
  workspaceId: string,
  accountIds: string[],
  range: DateRangeResult,
): ReturnType<
  typeof prisma.transaction.findMany<{
    include: { category: true; tags: { include: { tag: true } } };
  }>
> {
  return prisma.transaction.findMany({
    where: {
      workspaceId,
      accountId: { in: accountIds },
      bookedAt: { gte: range.previousStart, lte: range.currentEnd },
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

export function fetchDiscretionaryBudget(
  workspaceId: string,
  context: ContextFilter,
): ReturnType<typeof prisma.discretionaryBudget.findUnique> {
  return prisma.discretionaryBudget.findUnique({
    where: {
      workspaceId_accountContext: {
        workspaceId,
        accountContext: context,
      },
    },
  });
}

export function fetchDiscretionaryCategoryIds(
  workspaceId: string,
): ReturnType<typeof prisma.category.findMany<{ select: { id: true } }>> {
  return prisma.category.findMany({
    where: { workspaceId, isDiscretionary: true },
    select: { id: true },
  });
}
