import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { MappedDiscretionaryTx } from "@/lib/discretionary/aggregate-discretionary-merchants";
import type { TxWithCategory } from "@/lib/discretionary/discretionary-tx";
import { mapTransactionForDiscretionary } from "@/lib/discretionary/map-transaction-for-discretionary";
import { buildPairedOwnAccountTransferKeys } from "@/lib/transactions/match-own-account-transfer-pairs";

function splitDiscretionaryPeriod(
  transactions: TxWithCategory[],
  range: DateRangeResult,
): { current: TxWithCategory[]; previous: TxWithCategory[] } {
  const current = transactions.filter((tx) => tx.bookedAt >= range.currentStart);
  const previous = transactions.filter(
    (tx) => tx.bookedAt >= range.previousStart && tx.bookedAt < range.currentStart,
  );
  return { current, previous };
}

function mapDiscretionaryList(
  list: TxWithCategory[],
  pairedKeys: Set<string>,
): MappedDiscretionaryTx[] {
  return list.map((tx) => mapTransactionForDiscretionary(tx, pairedKeys));
}

function buildDiscretionaryPairedKeys(transactions: TxWithCategory[]): Set<string> {
  return buildPairedOwnAccountTransferKeys(
    transactions.map((tx) => ({
      key: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  );
}

export function mapDiscretionaryPeriods(
  transactions: TxWithCategory[],
  range: DateRangeResult,
): {
  pairedKeys: Set<string>;
  current: TxWithCategory[];
  currentMapped: MappedDiscretionaryTx[];
  previousMapped: MappedDiscretionaryTx[];
} {
  const pairedKeys = buildDiscretionaryPairedKeys(transactions);
  const { current, previous } = splitDiscretionaryPeriod(transactions, range);
  return {
    pairedKeys,
    current,
    currentMapped: mapDiscretionaryList(current, pairedKeys),
    previousMapped: mapDiscretionaryList(previous, pairedKeys),
  };
}
