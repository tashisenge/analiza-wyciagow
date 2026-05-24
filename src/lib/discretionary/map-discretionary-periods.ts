import type { DateRangeResult } from "@/lib/analytics/date-range";
import { splitByPeriod } from "@/lib/analytics/load-dashboard-metrics";
import type { MappedDiscretionaryTx } from "@/lib/discretionary/aggregate-discretionary-merchants";
import type { TxWithCategory } from "@/lib/discretionary/discretionary-tx";
import { mapTransactionForDiscretionary } from "@/lib/discretionary/map-transaction-for-discretionary";
import { buildPairedOwnAccountTransferKeys } from "@/lib/transactions/match-own-account-transfer-pairs";

export function mapDiscretionaryPeriods(
  transactions: TxWithCategory[],
  range: DateRangeResult,
): {
  pairedKeys: Set<string>;
  current: TxWithCategory[];
  currentMapped: MappedDiscretionaryTx[];
  previousMapped: MappedDiscretionaryTx[];
} {
  const pairedKeys = buildPairedOwnAccountTransferKeys(
    transactions.map((tx) => ({
      key: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  );
  const { current, previous } = splitByPeriod(transactions, range);
  const mapList = (list: TxWithCategory[]): MappedDiscretionaryTx[] =>
    list.map((tx) => mapTransactionForDiscretionary(tx, pairedKeys));
  return { pairedKeys, current, currentMapped: mapList(current), previousMapped: mapList(previous) };
}
