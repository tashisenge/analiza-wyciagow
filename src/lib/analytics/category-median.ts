export function medianExpenseAmounts(amounts: number[]): number {
  if (amounts.length === 0) {
    return 0;
  }
  const sorted = [...amounts].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

export function medianByCategory(
  txs: { categoryId: string | null; amount: string }[],
): Map<string, number> {
  const buckets = new Map<string, number[]>();
  for (const tx of txs) {
    if (Number(tx.amount) >= 0 || !tx.categoryId) {
      continue;
    }
    const list = buckets.get(tx.categoryId) ?? [];
    list.push(Math.abs(Number(tx.amount)));
    buckets.set(tx.categoryId, list);
  }
  const medians = new Map<string, number>();
  for (const [categoryId, amounts] of buckets) {
    medians.set(categoryId, medianExpenseAmounts(amounts));
  }
  return medians;
}
