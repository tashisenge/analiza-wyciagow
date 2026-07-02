import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";
import type { MappedDiscretionaryTx } from "@/lib/discretionary/aggregate-discretionary-merchants";

interface TxWithCategory {
  id: string;
  amount: { toString(): string };
  counterparty: string;
  category: { isDiscretionary: boolean; name: string } | null;
  tags?: { tag: { name: string } }[];
}

export function mapTransactionForDiscretionary(
  tx: TxWithCategory,
  pairedKeys: Set<string>,
): MappedDiscretionaryTx {
  return {
    amount: tx.amount.toString(),
    counterparty: tx.counterparty,
    tagNames: tx.tags?.map((entry) => entry.tag.name) ?? [],
    category: tx.category
      ? { isDiscretionary: tx.category.isDiscretionary, name: tx.category.name }
      : null,
    countsInAnalytics: shouldCountInAnalytics(
      { transactionKey: tx.id, category: tx.category },
      pairedKeys,
    ),
  };
}
