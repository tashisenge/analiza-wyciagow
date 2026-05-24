import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";
import { buildDashboardHref, buildPeriodHref } from "@/lib/analytics/dashboard-params";

const PERIODS = [
  { key: "month", label: "Miesiąc", tip: "Wybrany miesiąc vs poprzedni." },
  { key: "quarter", label: "Kwartał", tip: "Bieżący kwartał vs poprzedni." },
  { key: "year", label: "Rok", tip: "Pełny rok kalendarzowy lub YTD." },
] as const;

function periodHref(options: {
  basePath: string;
  context: string;
  periodKey: string;
  year?: number;
  month?: number;
}): string {
  const hrefOptions = {
    context: options.context,
    period: options.periodKey,
    year: options.periodKey === "year" ? options.year : undefined,
    month: options.periodKey === "month" ? options.month : undefined,
  };
  return options.basePath === "/dashboard"
    ? buildDashboardHref(hrefOptions)
    : buildPeriodHref(options.basePath, hrefOptions);
}

export function DateRangeToggle({
  active,
  context,
  year,
  month,
  basePath = "/dashboard",
}: {
  active: string;
  context: string;
  year?: number;
  month?: number;
  basePath?: string;
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
          href={periodHref({ basePath, context, periodKey: period.key, year, month })}
          active={active === period.key}
          title={period.tip}
        >
          {period.label}
        </FilterChip>
      ))}
    </div>
  );
}
