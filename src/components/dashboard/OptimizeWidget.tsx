import Link from "next/link";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { DashboardOpportunity } from "@/lib/analytics/load-dashboard";

interface OptimizeWidgetProps {
  context: string;
  opportunities: DashboardOpportunity[];
  budgetOverrunCount: number;
}

export function OptimizeWidget({
  context,
  opportunities,
  budgetOverrunCount,
}: OptimizeWidgetProps): React.JSX.Element {
  if (opportunities.length === 0 && budgetOverrunCount === 0) {
    return (
      <section className="section-card border-brand-200 bg-brand-50/60">
        <h2 className="section-title text-brand-900">Optymalizacja budżetu</h2>
        <p className="mt-1 text-sm text-brand-800">
          Brak wykrytych możliwości —{" "}
          <Link href={`/optimize?context=${context}`} className="link-brand">
            odśwież na stronie optymalizacji
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="section-card border-brand-200 bg-brand-50/60">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title text-brand-900">Top możliwości oszczędności</h2>
        <Link href={`/optimize?context=${context}`} className="link-brand text-sm">
          Wszystkie →
        </Link>
      </div>
      {budgetOverrunCount > 0 ? (
        <p className="mt-2 text-sm font-medium text-red-800">
          {String(budgetOverrunCount)} kategorii przekracza limit budżetu
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {opportunities.map((item) => {
          const savings = item.estimatedMonthlySavings
            ? Number(item.estimatedMonthlySavings)
            : null;
          return (
            <li key={item.id} className="text-sm text-slate-800">
              <span className="font-medium">{item.title}</span>
              {savings !== null ? (
                <span className="text-emerald-700">
                  {" "}
                  — <AmountValue>~{savings.toFixed(2)} PLN/mies.</AmountValue>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
