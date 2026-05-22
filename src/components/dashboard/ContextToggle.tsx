import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";
import type { ContextFilter } from "@/lib/analytics/filters";

const CONTEXTS: { value: ContextFilter; label: string; tip: string }[] = [
  { value: "razem", label: "Razem", tip: "Firma i dom łącznie." },
  { value: "dom", label: "Dom", tip: "Tylko konto domowe." },
  { value: "firma", label: "Firma", tip: "Tylko konto firmowe." },
];

interface ContextToggleProps {
  active: ContextFilter;
  period?: string;
  basePath?: string;
}

export function ContextToggle({
  active,
  period = "month",
  basePath = "/dashboard",
}: ContextToggleProps): React.JSX.Element {
  const query = basePath === "/dashboard" ? `&period=${period}` : "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Kontekst
      </span>
      <InfoTip label="Kontekst kont">
        Wybierz, które konta bankowe wliczasz do wykresów i sum.
      </InfoTip>
      {CONTEXTS.map((ctx) => (
        <FilterChip
          key={ctx.value}
          href={`${basePath}?context=${ctx.value}${query}`}
          active={active === ctx.value}
          title={ctx.tip}
        >
          {ctx.label}
        </FilterChip>
      ))}
    </div>
  );
}
