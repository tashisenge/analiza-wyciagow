import { isOwnAccountTransferPaired } from "@/lib/transactions/match-own-account-transfer-pairs";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

export interface AnalyticsTransactionInput {
  transactionKey: string;
  category?: { name: string } | null;
}

export function shouldCountInAnalytics(
  tx: AnalyticsTransactionInput,
  pairedOwnAccountTransferKeys: Set<string>,
): boolean {
  if (isOwnAccountTransferPaired(tx.transactionKey, pairedOwnAccountTransferKeys)) {
    return false;
  }
  if (tx.category?.name === TRANSFER_BETWEEN_ACCOUNTS_CATEGORY) {
    return false;
  }
  return true;
}
