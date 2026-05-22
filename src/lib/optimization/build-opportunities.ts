import { detectAnomalies } from "@/lib/optimization/detect-anomalies";
import {
  detectBudgetOverruns,
  type BudgetInput,
} from "@/lib/optimization/detect-budget-overruns";
import { detectMerchantSpikes } from "@/lib/optimization/detect-merchant-spikes";
import { detectRecurring } from "@/lib/optimization/detect-recurring";
import { detectSubscriptionsFromDates } from "@/lib/optimization/detect-subscriptions";
import { rankOpportunities } from "@/lib/optimization/rank-opportunities";
import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";

export interface BuildOpportunitiesInput {
  current: TxForOptimization[];
  history: TxForOptimization[];
  budgets: BudgetInput[];
  anchor?: Date;
}

function subscriptionDateMap(txs: TxForOptimization[]): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const tx of txs) {
    map.set(tx.id, tx.bookedAt);
  }
  return map;
}

export function buildOpportunities(
  input: BuildOpportunitiesInput,
): DetectedOpportunity[] {
  const anchor = input.anchor ?? new Date();
  const allTxs = [...input.current, ...input.history];
  const recurring = detectRecurring(allTxs, {}, anchor);
  const subscriptions = detectSubscriptionsFromDates(
    recurring,
    subscriptionDateMap(allTxs),
  );
  const recurringOnly = recurring.filter(
    (item) => !subscriptions.some((sub) => sub.counterparty === item.counterparty),
  );

  const detected = [
    ...subscriptions,
    ...recurringOnly,
    ...detectAnomalies(input.current, input.history),
    ...detectMerchantSpikes(input.current, input.history),
    ...detectBudgetOverruns(input.current, input.budgets),
  ];

  return rankOpportunities(detected);
}
