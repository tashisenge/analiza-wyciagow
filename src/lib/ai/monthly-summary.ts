import type { SpendingSummaryForAi } from "@/lib/ai/generate-insights";
import { categoryBreakdown } from "@/lib/analytics/category-breakdown";
import { topMerchants } from "@/lib/analytics/top-merchants";

interface TxWithCategory {
  bookedAt: Date;
  amount: { toString(): string };
  categoryId: string | null;
  counterparty: string;
  category: { name: string } | null;
  mbankCategory: string;
}

export function buildMonthlySummary(
  transactions: TxWithCategory[],
  periodLabel: string,
): SpendingSummaryForAi {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const current = transactions.filter((tx) => tx.bookedAt >= monthStart);
  const previous = transactions.filter(
    (tx) => tx.bookedAt >= prevStart && tx.bookedAt < monthStart,
  );

  const expenses = current.filter((tx) => Number(tx.amount) < 0);
  const income = current.filter((tx) => Number(tx.amount) > 0);
  const slices = categoryBreakdown(
    current.map((tx) => ({
      amount: tx.amount.toString(),
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? tx.mbankCategory,
    })),
  );
  const merchants = topMerchants(
    current.map((tx) => ({
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
    })),
    previous.map((tx) => ({
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
    })),
  );

  return {
    periodLabel,
    totalExpenses: expenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0),
    totalIncome: income.reduce((sum, tx) => sum + Number(tx.amount), 0),
    transactionCount: current.length,
    topCategories: slices.slice(0, 8).map((slice) => ({
      name: slice.categoryName,
      total: slice.total,
      percent: slice.percent,
    })),
    topMerchants: merchants.slice(0, 8).map((row) => ({
      name: row.counterparty,
      total: row.total,
      changePercent: row.changePercent,
    })),
    uncategorizedCount: current.filter((tx) => !tx.categoryId).length,
  };
}
