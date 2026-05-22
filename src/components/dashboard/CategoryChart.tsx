"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategorySlice } from "@/lib/analytics/category-breakdown";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#64748b",
];

interface CategoryChartProps {
  slices: CategorySlice[];
}

export function CategoryChart({ slices }: CategoryChartProps): React.JSX.Element {
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
            typeof value === "number" ? `${value.toFixed(2)} PLN` : String(value ?? "")
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
