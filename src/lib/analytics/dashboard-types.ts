import type { categoryBreakdown } from "@/lib/analytics/category-breakdown";
import type { groupExpensesByCategory } from "@/lib/analytics/category-transactions";
import type {
  RecurringPaymentRow,
  SubscriptionSummaryRow,
  YearlyMonthSummary,
} from "@/lib/analytics/dashboard-extras";
import type { MonthPoint } from "@/lib/analytics/monthly-trend";
import type { PeriodSummary } from "@/lib/analytics/period-summary";
import type { topMerchants } from "@/lib/analytics/top-merchants";

export interface DashboardOpportunity {
  id: string;
  title: string;
  type: string;
  counterparty: string | null;
  estimatedMonthlySavings: { toString(): string } | null;
}

export interface DashboardData {
  summary: PeriodSummary;
  previousSummary: PeriodSummary;
  slices: ReturnType<typeof categoryBreakdown>;
  categoryGroups: ReturnType<typeof groupExpensesByCategory>;
  merchants: ReturnType<typeof topMerchants>;
  uncategorized: number;
  categorizedPercent: number;
  aiTargetCount: number;
  lastAiInsight: string | null;
  lastAiInsightAt: Date | null;
  topOpportunities: DashboardOpportunity[];
  budgetOverrunCount: number;
  monthlyTrend: MonthPoint[];
  yearlyMonths: YearlyMonthSummary[];
  recurringPayments: RecurringPaymentRow[];
  markedSubscriptions: SubscriptionSummaryRow[];
}
