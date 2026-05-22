import { percentChange, type PeriodSummary } from "@/lib/analytics/period-summary";

interface PeriodSummaryCardsProps {
  summary: PeriodSummary;
  previous: PeriodSummary;
  periodLabel: string;
}

function ChangeBadge({ value }: { value: number | null }): React.JSX.Element | null {
  if (value === null) {
    return <span className="text-xs text-slate-400">brak porównania</span>;
  }
  const up = value > 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-red-600" : "text-green-600"}`}>
      {up ? "+" : ""}
      {String(value)}% vs poprz. okres
    </span>
  );
}

export function PeriodSummaryCards({
  summary,
  previous,
  periodLabel,
}: PeriodSummaryCardsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">Okres: {periodLabel}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Wydatki</p>
          <p className="text-xl font-semibold text-red-700">
            {summary.totalExpenses.toFixed(2)} PLN
          </p>
          <ChangeBadge
            value={percentChange(summary.totalExpenses, previous.totalExpenses)}
          />
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Wpływy</p>
          <p className="text-xl font-semibold text-green-700">
            {summary.totalIncome.toFixed(2)} PLN
          </p>
          <ChangeBadge value={percentChange(summary.totalIncome, previous.totalIncome)} />
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Bilans</p>
          <p className="text-xl font-semibold">{summary.net.toFixed(2)} PLN</p>
          <ChangeBadge value={percentChange(summary.net, previous.net)} />
        </div>
      </div>
    </div>
  );
}
