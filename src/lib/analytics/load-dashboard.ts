import type {
  RecurringPaymentRow,
  SubscriptionSummaryRow,
  YearlyMonthSummary,
} from "@/lib/analytics/dashboard-extras";
import type { DashboardData } from "@/lib/analytics/dashboard-types";
import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { accountIdsForContext } from "@/lib/analytics/filters";
import {
  buildDashboardTrendData,
  buildRecurringDashboardData,
  fetchRecurringOpportunities,
  loadSubscriptionMarkers,
} from "@/lib/analytics/load-dashboard-extras";
import {
  analyticsTransactions,
  buildDashboardMetrics,
  fetchDashboardRaw,
  splitByPeriod,
} from "@/lib/analytics/load-dashboard-metrics";
import { prisma } from "@/lib/db";

export async function loadDashboardData(
  workspaceId: string,
  context: ContextFilter,
  range: DateRangeResult,
): Promise<DashboardData> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const raw = await fetchDashboardRaw(workspaceId, accountIds, range, context);
  const [recurringOpportunities, subscriptionMarkers] = await Promise.all([
    fetchRecurringOpportunities(workspaceId, context),
    loadSubscriptionMarkers(workspaceId),
  ]);
  const { recurringPayments, markedSubscriptions } = buildRecurringDashboardData(
    recurringOpportunities,
    subscriptionMarkers,
  );
  const { current, previous } = splitByPeriod(raw.transactions, range);
  const uncategorized = current.filter((tx) => !tx.categoryId).length;
  const analyticsAll = analyticsTransactions(raw.transactions).map((tx) => ({
    bookedAt: tx.bookedAt,
    amount: tx.amount.toString(),
  }));
  const { monthlyTrend, yearlyMonths } = buildDashboardTrendData(analyticsAll, range);

  return {
    ...buildDashboardMetrics(current, previous, uncategorized, raw.totalInPeriod),
    uncategorized,
    aiTargetCount: raw.aiTargetCount,
    lastAiInsight: raw.workspace?.lastAiInsight ?? null,
    lastAiInsightAt: raw.workspace?.lastAiInsightAt ?? null,
    topOpportunities: raw.topOpportunities,
    budgetOverrunCount: raw.budgetOverrunCount,
    monthlyTrend,
    yearlyMonths,
    recurringPayments,
    markedSubscriptions,
  };
}

export type {
  DashboardData,
  DashboardOpportunity,
} from "@/lib/analytics/dashboard-types";
export type { RecurringPaymentRow, SubscriptionSummaryRow, YearlyMonthSummary };
