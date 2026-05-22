import Link from "next/link";

const FILTERS = [
  { key: "all", label: "Wszystkie", query: "" },
  { key: "uncategorized", label: "Bez kategorii", query: "uncategorized=1" },
  { key: "firma", label: "Firma", query: "context=firma" },
  { key: "dom", label: "Dom", query: "context=dom" },
] as const;

export function TransactionFilters({ active }: { active: string }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const href = filter.query ? `/transactions?${filter.query}` : "/transactions";
        return (
          <Link
            key={filter.key}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              active === filter.key
                ? "bg-indigo-600 text-white"
                : "border bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
