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

export function mapBudgetRowsForClient(
  rows: { budget: BudgetWithCategory; spent: number }[],
): {
  budget: {
    id: string;
    categoryId: string;
    category: { name: string };
    monthlyLimit: string;
  };
  spent: number;
}[] {
  return rows.map((row) => ({
    spent: row.spent,
    budget: {
      id: row.budget.id,
      categoryId: row.budget.categoryId,
      category: { name: row.budget.category.name },
      // Prisma Decimal is a class. Next.js throws if it is passed to a client component.
      monthlyLimit: row.budget.monthlyLimit.toString(),
    },
  }));
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
