import {
  buildSubscriptionSummaries,
  buildYearlyMonthSummaries,
  mapRecurringPayments,
  type RecurringPaymentRow,
  type SubscriptionSummaryRow,
  type YearlyMonthSummary,
} from "@/lib/analytics/dashboard-extras";
import type { DashboardOpportunity } from "@/lib/analytics/dashboard-types";
import type { ContextFilter } from "@/lib/analytics/filters";
import type { MonthPoint } from "@/lib/analytics/monthly-trend";
import { monthlyExpenseTrend } from "@/lib/analytics/monthly-trend";
import { prisma } from "@/lib/db";

interface TxForTrend {
  bookedAt: Date;
  amount: string;
}

export async function fetchRecurringOpportunities(
  workspaceId: string,
  context: ContextFilter,
): Promise<DashboardOpportunity[]> {
  return prisma.optimizationOpportunity.findMany({
    where: {
      workspaceId,
      status: "OPEN",
      accountContext: context,
      type: { in: ["RECURRING", "SUBSCRIPTION"] },
    },
    orderBy: { estimatedMonthlySavings: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      type: true,
      counterparty: true,
      estimatedMonthlySavings: true,
    },
  });
}

export async function loadSubscriptionMarkers(
  workspaceId: string,
): Promise<{ counterparty: string; note: string | null }[]> {
  return prisma.subscriptionMarker.findMany({
    where: { workspaceId },
    select: { counterparty: true, note: true },
  });
}

export function buildDashboardTrendData(
  transactions: TxForTrend[],
  range: { currentEnd: Date; currentStart: Date; isFullYear: boolean },
): { monthlyTrend: MonthPoint[]; yearlyMonths: YearlyMonthSummary[] } {
  const yearForTrend = range.currentStart.getFullYear();
  const yearStart = new Date(yearForTrend, 0, 1);
  const yearEnd = new Date(yearForTrend, 11, 31, 23, 59, 59, 999);
  const yearTransactions = transactions.filter(
    (tx) => tx.bookedAt >= yearStart && tx.bookedAt <= yearEnd,
  );
  return {
    monthlyTrend: monthlyExpenseTrend(
      transactions,
      range.currentEnd,
      range.isFullYear ? 12 : 6,
    ),
    yearlyMonths: range.isFullYear
      ? buildYearlyMonthSummaries(yearTransactions, yearForTrend)
      : [],
  };
}

export function buildRecurringDashboardData(
  opportunities: DashboardOpportunity[],
  markers: { counterparty: string; note: string | null }[],
): {
  recurringPayments: RecurringPaymentRow[];
  markedSubscriptions: SubscriptionSummaryRow[];
} {
  const markedCounterparties = new Set(markers.map((item) => item.counterparty));
  const recurringPayments = mapRecurringPayments(opportunities, markedCounterparties);
  return {
    recurringPayments,
    markedSubscriptions: buildSubscriptionSummaries(markers, recurringPayments),
  };
}
