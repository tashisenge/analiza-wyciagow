import type { Category, OptimizationOpportunity } from "@prisma/client";

import type {
  RecurringEvidenceTx,
  RecurringSuspectRow,
} from "@/lib/recurring/recurring-suspect-types";

type OpportunityWithCategory = OptimizationOpportunity & {
  category: Category | null;
};

export function mapRecurringSuspectRows(
  opportunities: OpportunityWithCategory[],
  markedCounterparties: Set<string>,
  evidenceById: Map<string, RecurringEvidenceTx>,
): RecurringSuspectRow[] {
  return opportunities.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title,
    description: item.description,
    counterparty: item.counterparty,
    categoryName: item.category?.name ?? null,
    estimatedMonthlySavings: item.estimatedMonthlySavings
      ? Number(item.estimatedMonthlySavings)
      : null,
    evidenceTransactions: item.evidenceTransactionIds
      .map((txId) => evidenceById.get(txId))
      .filter((tx): tx is RecurringEvidenceTx => tx !== undefined),
    isMarkedSubscription: item.counterparty
      ? markedCounterparties.has(item.counterparty)
      : false,
    detectedAt: item.detectedAt.toISOString(),
  }));
}
