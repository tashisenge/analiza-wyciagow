import { AmountValue } from "@/components/privacy/AmountValue";
import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

function limitBarClass(percent: number): string {
  if (percent > 100) {
    return "bg-red-500";
  }
  if (percent >= 80) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
}

interface DiscretionarySummaryCardsProps {
  summary: DiscretionaryPeriodSummary;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  periodLabel: string;
}

export function DiscretionarySummaryCards({
  summary,
  monthlyLimit,
  limitUsedPercent,
  periodLabel,
}: DiscretionarySummaryCardsProps): React.JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <article className="section-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Suma opcjonalnych · {periodLabel}
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          <AmountValue>{summary.totalPln.toFixed(2)} PLN</AmountValue>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {summary.transactionCount} transakcji
          {summary.vsPreviousPeriodPercent !== null ? (
            <>
              {" "}
              · {summary.vsPreviousPeriodPercent > 0 ? "+" : ""}
              {summary.vsPreviousPeriodPercent.toFixed(1)}% vs poprzedni okres
            </>
          ) : null}
        </p>
      </article>

      <article className="section-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Udział w wydatkach
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {summary.shareOfExpensesPercent !== null
            ? `${summary.shareOfExpensesPercent.toFixed(1)}%`
            : "—"}
        </p>
        <p className="mt-1 text-sm text-slate-600">Wszystkie wydatki w okresie</p>
      </article>

      <article className="section-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Limit miesięczny
        </p>
        {monthlyLimit === null || limitUsedPercent === null ? (
          <p className="mt-2 text-sm text-slate-600">Nie ustawiono</p>
        ) : (
          <>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {limitUsedPercent.toFixed(1)}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full ${limitBarClass(limitUsedPercent)}`}
                style={{ width: `${String(Math.min(limitUsedPercent, 100))}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              <AmountValue>{summary.totalPln.toFixed(2)}</AmountValue> /{" "}
              <AmountValue>{monthlyLimit.toFixed(2)} PLN</AmountValue>
            </p>
          </>
        )}
      </article>
    </div>
  );
}
