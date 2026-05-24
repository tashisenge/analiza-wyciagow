import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";

interface ExpenseTx {
  id: string;
  amount: { toString(): string };
  categoryId: string | null;
  category: { name: string } | null;
}

function isCountedExpense(tx: ExpenseTx, pairedKeys: Set<string>): boolean {
  if (
    !shouldCountInAnalytics({ transactionKey: tx.id, category: tx.category }, pairedKeys)
  ) {
    return false;
  }
  const value = Number.parseFloat(tx.amount.toString());
  return Number.isFinite(value) && value < 0;
}

export function expenseCoveragePercent(current: ExpenseTx[], pairedKeys: Set<string>): number {
  let expenseCount = 0;
  let categorizedExpenseCount = 0;

  for (const tx of current) {
    if (!isCountedExpense(tx, pairedKeys)) {
      continue;
    }
    expenseCount += 1;
    if (tx.categoryId) {
      categorizedExpenseCount += 1;
    }
  }

  if (expenseCount === 0) {
    return 100;
  }
  return Math.round((categorizedExpenseCount / expenseCount) * 1000) / 10;
}
