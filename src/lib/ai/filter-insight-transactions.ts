import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";
import { buildPairedOwnAccountTransferKeys } from "@/lib/transactions/match-own-account-transfer-pairs";

export interface InsightTransactionInput {
  id: string;
  accountId: string;
  amount: { toString(): string };
  currency: string;
  bookedAt: Date;
  categoryId: string | null;
  counterparty: string;
  mbankCategory: string;
  category: { name: string } | null;
}

export interface FilterInsightResult {
  included: InsightTransactionInput[];
  transfersFiltered: number;
  excludedByCategory: number;
}

export function filterTransactionsForInsight(
  transactions: InsightTransactionInput[],
  excludedCategoryIds: string[],
): FilterInsightResult {
  const excludedSet = new Set(excludedCategoryIds);
  const pairedKeys = buildPairedOwnAccountTransferKeys(
    transactions.map((tx) => ({
      key: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  );

  const included: InsightTransactionInput[] = [];
  let transfersFiltered = 0;
  let excludedByCategory = 0;

  for (const tx of transactions) {
    if (
      !shouldCountInAnalytics(
        { transactionKey: tx.id, category: tx.category },
        pairedKeys,
      )
    ) {
      transfersFiltered += 1;
      continue;
    }
    if (tx.categoryId && excludedSet.has(tx.categoryId)) {
      excludedByCategory += 1;
      continue;
    }
    included.push(tx);
  }

  return { included, transfersFiltered, excludedByCategory };
}
