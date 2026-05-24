import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";
import { buildDashboardHref } from "@/lib/analytics/dashboard-params";

const PERIODS = [
  { key: "month", label: "Miesiąc", tip: "Wybrany miesiąc vs poprzedni." },
  { key: "quarter", label: "Kwartał", tip: "Bieżący kwartał vs poprzedni." },
  { key: "year", label: "Rok", tip: "Pełny rok kalendarzowy lub YTD." },
] as const;

export function DateRangeToggle({
  active,
  context,
  year,
  month,
}: {
  active: string;
  context: string;
  year?: number;
  month?: number;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Okres
      </span>
      <InfoTip label="Zakres dat">
        Porównujemy wybrany okres z poprzednim o tej samej długości.
      </InfoTip>
      {PERIODS.map((period) => (
        <FilterChip
          key={period.key}
          href={buildDashboardHref({
            context,
            period: period.key,
            year: period.key === "year" ? year : undefined,
            month: period.key === "month" ? month : undefined,
          })}
          active={active === period.key}
          title={period.tip}
        >
          {period.label}
        </FilterChip>
      ))}
    </div>
  );
}
