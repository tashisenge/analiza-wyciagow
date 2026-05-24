import type { DashboardOpportunity } from "@/lib/analytics/dashboard-types";
import { monthlyExpenseTrend, type MonthPoint } from "@/lib/analytics/monthly-trend";

export interface RecurringPaymentRow {
  id: string;
  title: string;
  type: string;
  counterparty: string | null;
  estimatedMonthlySavings: number | null;
  isMarkedSubscription: boolean;
}

export interface SubscriptionSummaryRow {
  counterparty: string;
  note: string | null;
  monthlyAmount: number | null;
}

export interface YearlyMonthSummary extends MonthPoint {
  label: string;
}

const FALLBACK_COLORS = [
  "#0d9488",
  "#2dd4bf",
  "#f97316",
  "#a78bfa",
  "#34d399",
  "#38bdf8",
  "#fb7185",
  "#fbbf24",
  "#64748b",
  "#99f6e4",
];

export function sliceChartColor(slice: { categoryColor: string | null }, index: number): string {
  return slice.categoryColor ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? "#64748b";
}

export function categorySliceKey(categoryId: string | null, categoryName: string): string {
  return categoryId ?? `name:${categoryName}`;
}

export function buildYearlyMonthSummaries(
  txs: { bookedAt: Date; amount: string }[],
  year: number,
): YearlyMonthSummary[] {
  const anchor = new Date(year, 11, 1);
  const points = monthlyExpenseTrend(txs, anchor, 12);
  return points.map((point) => {
    const [, monthPart] = point.month.split("-");
    const monthIndex = Number.parseInt(monthPart ?? "1", 10) - 1;
    const label = new Date(year, monthIndex, 1).toLocaleDateString("pl-PL", {
      month: "short",
    });
    return { ...point, label };
  });
}

export function mapRecurringPayments(
  opportunities: DashboardOpportunity[],
  markedCounterparties: Set<string>,
): RecurringPaymentRow[] {
  return opportunities
    .filter((item) => item.type === "RECURRING" || item.type === "SUBSCRIPTION")
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      counterparty: item.counterparty ?? null,
      estimatedMonthlySavings: item.estimatedMonthlySavings
        ? Number(item.estimatedMonthlySavings)
        : null,
      isMarkedSubscription: item.counterparty
        ? markedCounterparties.has(item.counterparty)
        : false,
    }));
}

export function buildSubscriptionSummaries(
  markers: { counterparty: string; note: string | null }[],
  recurring: RecurringPaymentRow[],
): SubscriptionSummaryRow[] {
  const amountByCounterparty = new Map<string, number>();
  for (const item of recurring) {
    if (item.counterparty && item.estimatedMonthlySavings !== null) {
      amountByCounterparty.set(item.counterparty, item.estimatedMonthlySavings);
    }
  }
  return markers.map((marker) => ({
    counterparty: marker.counterparty,
    note: marker.note,
    monthlyAmount: amountByCounterparty.get(marker.counterparty) ?? null,
  }));
}
