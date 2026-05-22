import { medianByCategory } from "@/lib/analytics/category-median";
import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";
import { ANOMALY_MULTIPLIER } from "@/lib/optimization/types";

function buildAnomaly(tx: TxForOptimization, median: number): DetectedOpportunity {
  const amount = Math.abs(Number(tx.amount));
  const savings = Math.round((amount - median) * 100) / 100;
  const multiplier = String(ANOMALY_MULTIPLIER);
  return {
    type: "ANOMALY",
    title: `Wpadka: ${tx.categoryName}`,
    description: `Transakcja ${amount.toFixed(2)} PLN to ${multiplier}× mediana (${median.toFixed(2)} PLN)`,
    estimatedMonthlySavings: savings,
    counterparty: tx.counterparty || null,
    categoryId: tx.categoryId,
    evidenceTransactionIds: [tx.id],
    dedupeKey: `ANOMALY:${tx.id}`,
  };
}

export function detectAnomalies(
  current: TxForOptimization[],
  history: TxForOptimization[],
): DetectedOpportunity[] {
  const medians = medianByCategory(
    history.map((tx) => ({ categoryId: tx.categoryId, amount: tx.amount })),
  );
  const results: DetectedOpportunity[] = [];

  for (const tx of current) {
    if (Number(tx.amount) >= 0 || !tx.categoryId) {
      continue;
    }
    const median = medians.get(tx.categoryId) ?? 0;
    if (median <= 0) {
      continue;
    }
    const amount = Math.abs(Number(tx.amount));
    if (amount <= median * ANOMALY_MULTIPLIER) {
      continue;
    }
    results.push(buildAnomaly(tx, median));
  }
  return results;
}
