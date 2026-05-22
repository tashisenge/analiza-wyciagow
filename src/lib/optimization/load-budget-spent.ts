import { prisma } from "@/lib/db";

export interface BudgetWithCategory {
  id: string;
  categoryId: string;
  monthlyLimit: { toString(): string };
  category: { name: string };
}

export interface LoadBudgetSpentOptions {
  workspaceId: string;
  accountIds: string[];
  budgets: BudgetWithCategory[];
  monthStart: Date;
}

export async function loadBudgetSpentRows(
  options: LoadBudgetSpentOptions,
): Promise<{ budget: BudgetWithCategory; spent: number }[]> {
  return Promise.all(
    options.budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          workspaceId: options.workspaceId,
          accountId: { in: options.accountIds },
          categoryId: budget.categoryId,
          bookedAt: { gte: options.monthStart },
          amount: { lt: 0 },
        },
        _sum: { amount: true },
      });
      return { budget, spent: Math.abs(Number(spent._sum.amount ?? 0)) };
    }),
  );
}
