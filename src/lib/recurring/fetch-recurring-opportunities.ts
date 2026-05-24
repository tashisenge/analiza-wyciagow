import type { OpportunityStatus, Prisma } from "@prisma/client";

import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import type { RecurringStatusFilter } from "@/lib/recurring/recurring-suspect-types";

const RECURRING_TYPES = ["RECURRING", "SUBSCRIPTION"] as const;

export type RecurringOpportunityRow = Prisma.OptimizationOpportunityGetPayload<{
  include: { category: true };
}>;

export function recurringStatusesForFilter(
  filter: RecurringStatusFilter,
): OpportunityStatus[] | undefined {
  switch (filter) {
    case "open":
      return ["OPEN"];
    case "accepted":
      return ["ACKNOWLEDGED", "IMPLEMENTED"];
    case "dismissed":
      return ["DISMISSED"];
    case "all":
      return undefined;
  }
}

export function recurringBaseWhere(
  workspaceId: string,
  context: ContextFilter,
): Prisma.OptimizationOpportunityWhereInput {
  return {
    workspaceId,
    accountContext: context,
    type: { in: [...RECURRING_TYPES] },
  };
}

export async function fetchRecurringOpportunityList(
  workspaceId: string,
  context: ContextFilter,
  statusFilter: RecurringStatusFilter,
): Promise<RecurringOpportunityRow[]> {
  const statuses = recurringStatusesForFilter(statusFilter);
  const baseWhere = recurringBaseWhere(workspaceId, context);
  return prisma.optimizationOpportunity.findMany({
    where: { ...baseWhere, ...(statuses ? { status: { in: statuses } } : {}) },
    include: { category: true },
    orderBy: [{ status: "asc" }, { estimatedMonthlySavings: "desc" }],
  });
}

export async function fetchRecurringStatusCounts(
  workspaceId: string,
  context: ContextFilter,
): Promise<{ openCount: number; acceptedCount: number; dismissedCount: number }> {
  const baseWhere = recurringBaseWhere(workspaceId, context);
  const [openCount, acceptedCount, dismissedCount] = await Promise.all([
    prisma.optimizationOpportunity.count({ where: { ...baseWhere, status: "OPEN" } }),
    prisma.optimizationOpportunity.count({
      where: { ...baseWhere, status: { in: ["ACKNOWLEDGED", "IMPLEMENTED"] } },
    }),
    prisma.optimizationOpportunity.count({
      where: { ...baseWhere, status: "DISMISSED" },
    }),
  ]);
  return { openCount, acceptedCount, dismissedCount };
}

export async function fetchSubscriptionCounterparties(
  workspaceId: string,
): Promise<Set<string>> {
  const markers = await prisma.subscriptionMarker.findMany({
    where: { workspaceId },
    select: { counterparty: true },
  });
  return new Set(markers.map((item) => item.counterparty));
}
