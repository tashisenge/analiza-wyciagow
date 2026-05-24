import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";

export function discretionaryAmountPln(amount: string): number {
  const value = Number.parseFloat(amount);
  return Number.isFinite(value) && value < 0 ? Math.abs(value) : 0;
}

export function sumDiscretionaryPln(
  transactions: {
    amount: string;
    category: { isDiscretionary: boolean; name: string } | null;
    countsInAnalytics: boolean;
  }[],
): { totalPln: number; count: number } {
  let totalPln = 0;
  let count = 0;
  for (const tx of transactions) {
    if (!isDiscretionaryExpense(tx)) {
      continue;
    }
    totalPln += discretionaryAmountPln(tx.amount);
    count += 1;
  }
  return { totalPln, count };
}

export function sumExpensePln(
  transactions: { amount: string; countsInAnalytics: boolean }[],
): number {
  let total = 0;
  for (const tx of transactions) {
    if (!tx.countsInAnalytics) {
      continue;
    }
    const value = Number.parseFloat(tx.amount);
    if (Number.isFinite(value) && value < 0) {
      total += Math.abs(value);
    }
  }
  return total;
}
