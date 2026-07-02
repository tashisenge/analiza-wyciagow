import type { DiscretionaryMerchantRow } from "@/lib/discretionary/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? null : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function rankDiscretionaryMerchants(
  rows: {
    counterparty: string;
    currentPln: number;
    previousPln: number;
    count: number;
  }[],
  limit: number,
): DiscretionaryMerchantRow[] {
  return [...rows]
    .sort((a, b) => b.currentPln - a.currentPln)
    .slice(0, limit)
    .map((row) => ({
      counterparty: row.counterparty,
      totalPln: row.currentPln,
      transactionCount: row.count,
      vsPreviousPeriodPercent: percentChange(row.currentPln, row.previousPln),
    }));
}
