import { normalizeCounterpartyKey } from "@/lib/transactions/normalize-counterparty-key";

export interface TransactionCounterpartyRef {
  id: string;
  counterparty: string;
}

export function buildSimilarCountByTransactionId(
  transactions: TransactionCounterpartyRef[],
): Map<string, number> {
  const totalsByKey = new Map<string, number>();
  for (const tx of transactions) {
    const key = normalizeCounterpartyKey(tx.counterparty);
    if (!key) {
      continue;
    }
    totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + 1);
  }

  const result = new Map<string, number>();
  for (const tx of transactions) {
    const key = normalizeCounterpartyKey(tx.counterparty);
    const total = key ? (totalsByKey.get(key) ?? 1) : 0;
    result.set(tx.id, Math.max(0, total - 1));
  }
  return result;
}
