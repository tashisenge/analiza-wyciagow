import type {
  DetectedOpportunity,
  RecurringOptions,
  TxForOptimization,
} from "@/lib/optimization/types";
import { DEFAULT_RECURRING_OPTIONS } from "@/lib/optimization/types";

type GroupedTx = TxForOptimization & { absAmount: number };

function withinTolerance(base: number, value: number, tolerancePercent: number): boolean {
  const tolerance = base * (tolerancePercent / 100);
  return Math.abs(value - base) <= tolerance;
}

function groupByCounterparty(txs: GroupedTx[]): Map<string, GroupedTx[]> {
  const groups = new Map<string, GroupedTx[]>();
  for (const tx of txs) {
    const key = tx.counterparty.trim() || "Nieznany";
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  }
  return groups;
}

function filterByWindow(txs: GroupedTx[], windowDays: number, anchor: Date): GroupedTx[] {
  const cutoff = new Date(anchor.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return txs.filter((tx) => tx.bookedAt >= cutoff);
}

function buildRecurringOpportunity(
  counterparty: string,
  group: GroupedTx[],
): DetectedOpportunity {
  const monthlyAvg =
    group.reduce((sum, tx) => sum + tx.absAmount, 0) / Math.max(1, group.length);
  return {
    type: "RECURRING",
    title: `Powtarzalne: ${counterparty}`,
    description: `${String(group.length)} podobnych transakcji (~${monthlyAvg.toFixed(2)} PLN)`,
    estimatedMonthlySavings: Math.round(monthlyAvg * 100) / 100,
    counterparty,
    categoryId: group[0]?.categoryId ?? null,
    evidenceTransactionIds: group.map((tx) => tx.id),
    dedupeKey: `RECURRING:${counterparty}`,
  };
}

function matchRecurringGroup(
  group: GroupedTx[],
  config: RecurringOptions,
): DetectedOpportunity | null {
  if (group.length < config.minOccurrences) {
    return null;
  }
  const baseAmount = group[0]?.absAmount ?? 0;
  const matching = group.filter((tx) =>
    withinTolerance(baseAmount, tx.absAmount, config.amountTolerancePercent),
  );
  if (matching.length < config.minOccurrences) {
    return null;
  }
  const counterparty = matching[0]?.counterparty.trim() ?? "Nieznany";
  return buildRecurringOpportunity(counterparty, matching);
}

export function detectRecurring(
  txs: TxForOptimization[],
  options: Partial<RecurringOptions> = {},
  anchor: Date = new Date(),
): DetectedOpportunity[] {
  const config = { ...DEFAULT_RECURRING_OPTIONS, ...options };
  const expenses = txs
    .filter((tx) => Number(tx.amount) < 0)
    .map((tx) => ({ ...tx, absAmount: Math.abs(Number(tx.amount)) }));

  const results: DetectedOpportunity[] = [];
  for (const [, rawGroup] of groupByCounterparty(expenses)) {
    const group = filterByWindow(rawGroup, config.windowDays, anchor);
    const found = matchRecurringGroup(group, config);
    if (found) {
      results.push(found);
    }
  }
  return results;
}
