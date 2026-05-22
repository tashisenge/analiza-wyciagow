import { isInternalTransfer } from "@/lib/transactions/is-internal-transfer";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

export interface AnalyticsTransactionInput {
  description: string;
  mbankCategory?: string;
  category?: { name: string } | null;
}

export function shouldCountInAnalytics(tx: AnalyticsTransactionInput): boolean {
  if (tx.category?.name === TRANSFER_BETWEEN_ACCOUNTS_CATEGORY) {
    return false;
  }
  return !isInternalTransfer({
    description: tx.description,
    mbankCategory: tx.mbankCategory,
  });
}
