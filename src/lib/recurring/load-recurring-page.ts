import type { ContextFilter } from "@/lib/analytics/filters";
import {
  fetchRecurringOpportunityList,
  fetchRecurringStatusCounts,
  fetchSubscriptionCounterparties,
} from "@/lib/recurring/fetch-recurring-opportunities";
import { loadRecurringEvidenceById } from "@/lib/recurring/load-recurring-evidence";
import { mapRecurringSuspectRows } from "@/lib/recurring/map-recurring-suspects";
import type {
  RecurringStatusFilter,
  RecurringSuspectRow,
} from "@/lib/recurring/recurring-suspect-types";

export async function loadRecurringPageData(
  workspaceId: string,
  context: ContextFilter,
  statusFilter: RecurringStatusFilter,
): Promise<{
  suspects: RecurringSuspectRow[];
  openCount: number;
  acceptedCount: number;
  dismissedCount: number;
}> {
  const [opportunities, markedCounterparties, counts] = await Promise.all([
    fetchRecurringOpportunityList(workspaceId, context, statusFilter),
    fetchSubscriptionCounterparties(workspaceId),
    fetchRecurringStatusCounts(workspaceId, context),
  ]);

  const evidenceIds = opportunities.flatMap((item) => item.evidenceTransactionIds);
  const evidenceById = await loadRecurringEvidenceById(workspaceId, evidenceIds);

  return {
    suspects: mapRecurringSuspectRows(opportunities, markedCounterparties, evidenceById),
    ...counts,
  };
}
