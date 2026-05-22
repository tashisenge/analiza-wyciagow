"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";
import { useAmountTooltipLabel } from "@/components/privacy/use-amount-tooltip-label";
import type { MerchantRow } from "@/lib/analytics/top-merchants";

interface MerchantChartProps {
  merchants: MerchantRow[];
}

export function MerchantChart({ merchants }: MerchantChartProps): React.JSX.Element {
  const { hidden } = usePrivacyAmounts();
  const formatTooltip = useAmountTooltipLabel();
  if (merchants.length === 0) {
    return <p className="text-sm text-slate-500">Brak danych o kontrahentach.</p>;
  }
  const data = merchants.slice(0, 10).map((row) => ({
    name: row.counterparty.slice(0, 24),
    total: row.total,
    change: row.changePercent,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" tickFormatter={hidden ? () => "•••" : undefined} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, _name, item) => {
            const num = typeof value === "number" ? value : Number(value);
            const payload = item.payload as { change: number | null };
            const change = payload.change;
            const changeLabel =
              change === null
                ? "brak porównania"
                : `${change > 0 ? "+" : ""}${String(change)}%`;
            return [`${formatTooltip(num)} (${changeLabel})`, "Suma"];
          }}
        />
        <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
