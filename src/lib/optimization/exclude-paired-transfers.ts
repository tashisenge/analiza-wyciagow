import {
  buildPairedOwnAccountTransferKeys,
  type OwnAccountTransferRef,
} from "@/lib/transactions/match-own-account-transfer-pairs";

export interface OptimizableTransferCandidate {
  id: string;
  accountId: string;
  amount: string | { toString(): string };
  currency: string;
  bookedAt: Date;
}

function toTransferRef(tx: OptimizableTransferCandidate): OwnAccountTransferRef {
  return {
    key: tx.id,
    accountId: tx.accountId,
    amount: tx.amount,
    currency: tx.currency,
    bookedAt: tx.bookedAt,
  };
}

/** Drops own-account transfer pairs so detectors do not treat them as spend. */
export function excludePairedOwnAccountTransfers<T extends OptimizableTransferCandidate>(
  transactions: T[],
): T[] {
  const pairedKeys = buildPairedOwnAccountTransferKeys(transactions.map(toTransferRef));
  if (pairedKeys.size === 0) {
    return transactions;
  }
  return transactions.filter((tx) => !pairedKeys.has(tx.id));
}
