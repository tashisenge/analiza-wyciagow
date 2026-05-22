import { normalizeAmountForMatch } from "@/lib/transactions/normalize-amount-for-match";
import { normalizeCounterpartyKey } from "@/lib/transactions/normalize-counterparty-key";

export interface TransactionSimilarityRef {
  id: string;
  counterparty: string;
  amount: string | { toString(): string };
  currency: string;
}

export interface SimilarTransactionCounts {
  byCounterparty: number;
  byCounterpartyAndAmount: number;
}

function buildCounterpartyTotals(
  transactions: TransactionSimilarityRef[],
): Map<string, number> {
  const totalsByKey = new Map<string, number>();
  for (const tx of transactions) {
    const key = normalizeCounterpartyKey(tx.counterparty);
    if (!key) {
      continue;
    }
    totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + 1);
  }
  return totalsByKey;
}

function buildCounterpartyAmountTotals(
  transactions: TransactionSimilarityRef[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    const counterpartyKey = normalizeCounterpartyKey(tx.counterparty);
    if (!counterpartyKey) {
      continue;
    }
    const amountKey = `${counterpartyKey}|${tx.currency}|${normalizeAmountForMatch(tx.amount)}`;
    totals.set(amountKey, (totals.get(amountKey) ?? 0) + 1);
  }
  return totals;
}

export function buildSimilarCountsByTransactionId(
  transactions: TransactionSimilarityRef[],
): Map<string, SimilarTransactionCounts> {
  const counterpartyTotals = buildCounterpartyTotals(transactions);
  const amountTotals = buildCounterpartyAmountTotals(transactions);
  const result = new Map<string, SimilarTransactionCounts>();

  for (const tx of transactions) {
    const counterpartyKey = normalizeCounterpartyKey(tx.counterparty);
    const counterpartyTotal = counterpartyKey
      ? (counterpartyTotals.get(counterpartyKey) ?? 1)
      : 0;
    const amountKey = counterpartyKey
      ? `${counterpartyKey}|${tx.currency}|${normalizeAmountForMatch(tx.amount)}`
      : "";
    const amountTotal = amountKey ? (amountTotals.get(amountKey) ?? 1) : 0;

    result.set(tx.id, {
      byCounterparty: Math.max(0, counterpartyTotal - 1),
      byCounterpartyAndAmount: Math.max(0, amountTotal - 1),
    });
  }

  return result;
}
