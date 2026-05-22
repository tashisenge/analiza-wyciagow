"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useAmountTooltipLabel } from "@/components/privacy/use-amount-tooltip-label";
import type { CategorySlice } from "@/lib/analytics/category-breakdown";

const COLORS = [
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

interface CategoryChartProps {
  slices: CategorySlice[];
}

export function CategoryChart({ slices }: CategoryChartProps): React.JSX.Element {
  const formatTooltip = useAmountTooltipLabel();
  if (slices.length === 0) {
    return <p className="text-sm text-slate-500">Brak wydatków w tym okresie.</p>;
  }
  const data = slices.map((slice, index) => ({
    name: slice.categoryName,
    value: slice.total,
    fill: COLORS[index % COLORS.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === "number" ? formatTooltip(value) : String(value ?? "")
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
