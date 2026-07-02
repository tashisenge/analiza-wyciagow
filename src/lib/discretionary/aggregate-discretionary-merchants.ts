import { rankDiscretionaryMerchants } from "@/lib/discretionary/compute-discretionary-merchants";
import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";
import { discretionaryAmountPln } from "@/lib/discretionary/map-transactions-for-discretionary";
import type { DiscretionaryMerchantRow } from "@/lib/discretionary/types";

export interface MappedDiscretionaryTx {
  amount: string;
  counterparty: string;
  tagNames: string[];
  category: { isDiscretionary: boolean; name: string } | null;
  countsInAnalytics: boolean;
}

function counterpartyKey(counterparty: string): string {
  return counterparty.trim() || "(brak kontrahenta)";
}

function accumulateCurrentPeriod(
  transactions: MappedDiscretionaryTx[],
): Map<string, { pln: number; count: number }> {
  const totals = new Map<string, { pln: number; count: number }>();
  for (const tx of transactions) {
    if (!isDiscretionaryExpense(tx)) {
      continue;
    }
    const key = counterpartyKey(tx.counterparty);
    const row = totals.get(key) ?? { pln: 0, count: 0 };
    row.pln += discretionaryAmountPln(tx.amount);
    row.count += 1;
    totals.set(key, row);
  }
  return totals;
}

function accumulatePreviousPeriod(
  transactions: MappedDiscretionaryTx[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (!isDiscretionaryExpense(tx)) {
      continue;
    }
    const key = counterpartyKey(tx.counterparty);
    totals.set(key, (totals.get(key) ?? 0) + discretionaryAmountPln(tx.amount));
  }
  return totals;
}

export function aggregateDiscretionaryMerchants(
  current: MappedDiscretionaryTx[],
  previous: MappedDiscretionaryTx[],
  limit: number,
): DiscretionaryMerchantRow[] {
  const currentByCounterparty = accumulateCurrentPeriod(current);
  const previousByCounterparty = accumulatePreviousPeriod(previous);

  return rankDiscretionaryMerchants(
    [...currentByCounterparty.entries()].map(([counterparty, data]) => ({
      counterparty,
      currentPln: data.pln,
      previousPln: previousByCounterparty.get(counterparty) ?? 0,
      count: data.count,
    })),
    limit,
  );
}
