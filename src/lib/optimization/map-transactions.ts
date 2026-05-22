import type { TxForOptimization } from "@/lib/optimization/types";
import { transactionCategoryLabel } from "@/lib/transaction-category-label";

interface TxRow {
  id: string;
  bookedAt: Date;
  amount: { toString(): string };
  counterparty: string;
  categoryId: string | null;
  category: { name: string } | null;
  mbankCategory: string;
}

export function mapTransactionsForOptimization(txs: TxRow[]): TxForOptimization[] {
  return txs.map((tx) => ({
    id: tx.id,
    bookedAt: tx.bookedAt,
    amount: tx.amount.toString(),
    counterparty: tx.counterparty,
    categoryId: tx.categoryId,
    categoryName: transactionCategoryLabel(tx),
  }));
}
