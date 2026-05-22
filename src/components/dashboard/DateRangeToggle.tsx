import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";

const PERIODS = [
  { key: "month", label: "Miesiąc", tip: "Bieżący miesiąc vs poprzedni." },
  { key: "quarter", label: "Kwartał", tip: "Ostatnie 3 miesiące." },
  { key: "year", label: "Rok", tip: "Ostatnie 12 miesięcy." },
] as const;

export function DateRangeToggle({
  active,
  context,
}: {
  active: string;
  context: string;
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
          href={`/dashboard?context=${context}&period=${period.key}`}
          active={active === period.key}
          title={period.tip}
        >
          {period.label}
        </FilterChip>
      ))}
    </div>
  );
}
