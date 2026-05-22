import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";

const FILTERS = [
  { key: "all", label: "Wszystkie", query: "", tip: "Pełna lista (max 200)." },
  {
    key: "uncategorized",
    label: "Bez kategorii",
    query: "uncategorized=1",
    tip: "Tylko transakcje bez przypisanej kategorii.",
  },
  { key: "firma", label: "Firma", query: "context=firma", tip: "Konto firmowe." },
  { key: "dom", label: "Dom", query: "context=dom", tip: "Konto domowe." },
] as const;

export function TransactionFilters({ active }: { active: string }): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Filtr
        <InfoTip label="Filtry listy">
          Zawęż listę przed masową kategoryzacją. Kliknij nagłówek kolumny „Podobne” w
          pomocy poniżej.
        </InfoTip>
      </span>
      {FILTERS.map((filter) => {
        const href = filter.query ? `/transactions?${filter.query}` : "/transactions";
        return (
          <FilterChip
            key={filter.key}
            href={href}
            active={active === filter.key}
            title={filter.tip}
          >
            {filter.label}
          </FilterChip>
        );
      })}
    </div>
  );
}
