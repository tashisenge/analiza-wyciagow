import { topMerchants } from "@/lib/analytics/top-merchants";
import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";
import {
  SPIKE_MIN_AMOUNT_PLN,
  SPIKE_MIN_INCREASE_PERCENT,
} from "@/lib/optimization/types";

function isSpike(changePercent: number | null, total: number): boolean {
  if (changePercent === null) {
    return false;
  }
  const increase = total - total / (1 + changePercent / 100);
  return changePercent >= SPIKE_MIN_INCREASE_PERCENT && increase >= SPIKE_MIN_AMOUNT_PLN;
}

function toSpike(row: {
  counterparty: string;
  total: number;
  changePercent: number | null;
}): DetectedOpportunity {
  const prevTotal =
    row.changePercent === null
      ? 0
      : Math.round((row.total / (1 + row.changePercent / 100)) * 100) / 100;
  const savings = Math.round((row.total - prevTotal) * 100) / 100;
  return {
    type: "MERCHANT_SPIKE",
    title: `Skok wydatków: ${row.counterparty}`,
    description: `Wzrost ${String(row.changePercent)}% m/m (${prevTotal.toFixed(2)} → ${row.total.toFixed(2)} PLN)`,
    estimatedMonthlySavings: savings,
    counterparty: row.counterparty,
    categoryId: null,
    evidenceTransactionIds: [],
    dedupeKey: `MERCHANT_SPIKE:${row.counterparty}`,
  };
}

export function detectMerchantSpikes(
  current: TxForOptimization[],
  previous: TxForOptimization[],
): DetectedOpportunity[] {
  const rows = topMerchants(
    current.map((tx) => ({ counterparty: tx.counterparty, amount: tx.amount })),
    previous.map((tx) => ({ counterparty: tx.counterparty, amount: tx.amount })),
    15,
  );
  return rows.filter((row) => isSpike(row.changePercent, row.total)).map(toSpike);
}
