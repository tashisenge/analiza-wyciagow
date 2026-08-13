export interface MonthPoint {
  month: string;
  total: number;
}

/** Dashboard "ostatnie 6 miesięcy" chart; keep fetch window in sync. */
export const DASHBOARD_TREND_MONTHS = 6;

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

export function trendWindowStart(anchor: Date, months = DASHBOARD_TREND_MONTHS): Date {
  return addMonths(startOfMonth(anchor), -(months - 1));
}

/** Earliest bookedAt the dashboard must load so the trend chart is not zero-filled. */
export function dashboardTransactionFetchStart(
  previousStart: Date,
  currentEnd: Date,
  months = DASHBOARD_TREND_MONTHS,
): Date {
  const trendStart = trendWindowStart(currentEnd, months);
  return trendStart.getTime() < previousStart.getTime() ? trendStart : previousStart;
}

export function monthlyExpenseTrend(
  txs: { bookedAt: Date; amount: string }[],
  anchor: Date,
  months = DASHBOARD_TREND_MONTHS,
): MonthPoint[] {
  const windowStart = trendWindowStart(anchor, months);

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
