export interface DiscretionaryTxInput {
  amount: string;
  category: { isDiscretionary: boolean; name: string } | null;
  countsInAnalytics: boolean;
}

export function isDiscretionaryExpense(tx: DiscretionaryTxInput): boolean {
  if (!tx.countsInAnalytics) {
    return false;
  }
  if (!tx.category?.isDiscretionary) {
    return false;
  }
  const value = Number.parseFloat(tx.amount);
  return Number.isFinite(value) && value < 0;
}
