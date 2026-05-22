import { AmountValue } from "@/components/privacy/AmountValue";
import { InfoTip } from "@/components/ui/InfoTip";
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
    <span className={`text-xs font-medium ${up ? "text-accent-600" : "text-brand-700"}`}>
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
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Okres: <strong className="text-slate-800">{periodLabel}</strong>
        <InfoTip label="KPI">
          Transfery między własnymi kontami nie wliczają się do wydatków i wpływów.
        </InfoTip>
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="section-card border-l-4 border-l-accent-400">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Wydatki
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            <AmountValue>{summary.totalExpenses.toFixed(2)} PLN</AmountValue>
          </p>
          <ChangeBadge
            value={percentChange(summary.totalExpenses, previous.totalExpenses)}
          />
        </div>
        <div className="section-card border-l-4 border-l-brand-500">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Wpływy
          </p>
          <p className="mt-1 text-xl font-semibold text-brand-800">
            <AmountValue>{summary.totalIncome.toFixed(2)} PLN</AmountValue>
          </p>
          <ChangeBadge value={percentChange(summary.totalIncome, previous.totalIncome)} />
        </div>
        <div className="section-card border-l-4 border-l-calm-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Bilans
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            <AmountValue>{summary.net.toFixed(2)} PLN</AmountValue>
          </p>
          <ChangeBadge value={percentChange(summary.net, previous.net)} />
        </div>
      </div>
    </div>
  );
}
