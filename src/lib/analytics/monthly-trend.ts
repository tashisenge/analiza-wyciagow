export interface MonthPoint {
  month: string;
  total: number;
}

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${String(year)}-${month}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function monthlyExpenseTrend(
  txs: { bookedAt: Date; amount: string }[],
  anchor: Date,
  months = 6,
): MonthPoint[] {
  const anchorMonth = startOfMonth(anchor);
  const windowStart = addMonths(anchorMonth, -(months - 1));

  const totals = new Map<string, number>();
  for (let index = 0; index < months; index += 1) {
    totals.set(monthKey(addMonths(windowStart, index)), 0);
  }

  for (const tx of txs) {
    if (Number(tx.amount) >= 0) {
      continue;
    }
    const key = monthKey(tx.bookedAt);
    if (!totals.has(key)) {
      continue;
    }
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(Number(tx.amount)));
  }

  return [...totals.entries()].map(([month, total]) => ({ month, total }));
}
