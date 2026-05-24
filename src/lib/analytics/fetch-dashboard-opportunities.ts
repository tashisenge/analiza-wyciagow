import type { DashboardOpportunity } from "@/lib/analytics/dashboard-types";
import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";

async function fetchTopOpen(
  workspaceId: string,
  context: ContextFilter,
): Promise<DashboardOpportunity[]> {
  return prisma.optimizationOpportunity.findMany({
    where: { workspaceId, status: "OPEN", accountContext: context },
    orderBy: { estimatedMonthlySavings: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      type: true,
      counterparty: true,
      estimatedMonthlySavings: true,
    },
  });
}

export async function fetchDashboardOpportunities(
  workspaceId: string,
  context: ContextFilter,
): Promise<{ topOpportunities: DashboardOpportunity[]; budgetOverrunCount: number }> {
  const [topOpportunities, budgetOverrunCount] = await Promise.all([
    fetchTopOpen(workspaceId, context),
    prisma.optimizationOpportunity.count({
      where: {
        workspaceId,
        status: "OPEN",
        accountContext: context,
        type: "BUDGET_OVERRUN",
      },
    }),
  ]);
  return { topOpportunities, budgetOverrunCount };
}
