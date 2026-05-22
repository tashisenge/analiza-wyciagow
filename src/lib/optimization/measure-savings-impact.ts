import type { TxForOptimization } from "@/lib/optimization/types";

export function measureSavingsImpact(
  counterparty: string,
  before: TxForOptimization[],
  after: TxForOptimization[],
): boolean {
  const key = counterparty.trim() || "Nieznany";
  const sumPeriod = (txs: TxForOptimization[]): number =>
    txs
      .filter(
        (tx) => (tx.counterparty.trim() || "Nieznany") === key && Number(tx.amount) < 0,
      )
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  const beforeTotal = sumPeriod(before);
  const afterTotal = sumPeriod(after);
  if (beforeTotal <= 0) {
    return false;
  }
  const dropPercent = ((beforeTotal - afterTotal) / beforeTotal) * 100;
  return dropPercent > 10;
}
