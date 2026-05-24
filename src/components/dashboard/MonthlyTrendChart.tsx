"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";
import { useAmountTooltipLabel } from "@/components/privacy/use-amount-tooltip-label";
import type { YearlyMonthSummary } from "@/lib/analytics/dashboard-extras";
import type { MonthPoint } from "@/lib/analytics/monthly-trend";

interface MonthlyTrendChartProps {
  points: MonthPoint[];
  yearlyMonths?: YearlyMonthSummary[];
  title?: string;
}

function formatMonthLabel(point: MonthPoint, yearlyMonths: YearlyMonthSummary[]): string {
  const yearly = yearlyMonths.find((item) => item.month === point.month);
  if (yearly) {
    return yearly.label;
  }
  const [, monthPart] = point.month.split("-");
  const monthIndex = Number.parseInt(monthPart ?? "1", 10) - 1;
  return new Date(2026, monthIndex, 1).toLocaleDateString("pl-PL", { month: "short" });
}

export function MonthlyTrendChart({
  points,
  yearlyMonths = [],
  title,
}: MonthlyTrendChartProps): React.JSX.Element {
  const { hidden } = usePrivacyAmounts();
  const formatTooltip = useAmountTooltipLabel();
  const data = useMemo(
    () =>
      points.map((point) => ({
        name: formatMonthLabel(point, yearlyMonths),
        total: point.total,
      })),
    [points, yearlyMonths],
  );

  if (data.every((item) => item.total === 0)) {
    return <p className="text-sm text-slate-500">Brak wydatków w tym okresie.</p>;
  }

  return (
    <div>
      {title ? <h3 className="mb-2 font-medium text-slate-700">{title}</h3> : null}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 8, right: 16, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={hidden ? () => "•••" : undefined} />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? formatTooltip(value) : String(value ?? "")
            }
          />
          <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface YearlySummaryCardsProps {
  summary: { totalExpenses: number; totalIncome: number; net: number };
  year: number;
}

export function YearlySummaryCards({
  summary,
  year,
}: YearlySummaryCardsProps): React.JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-calm-200 bg-white p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Wydatki {year}</p>
        <p className="mt-1 text-lg font-semibold text-red-700">
          {summary.totalExpenses.toFixed(2)} PLN
        </p>
      </div>
      <div className="rounded-lg border border-calm-200 bg-white p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Przychody {year}</p>
        <p className="mt-1 text-lg font-semibold text-emerald-700">
          {summary.totalIncome.toFixed(2)} PLN
        </p>
      </div>
      <div className="rounded-lg border border-calm-200 bg-white p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Saldo {year}</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{summary.net.toFixed(2)} PLN</p>
      </div>
    </div>
  );
}
