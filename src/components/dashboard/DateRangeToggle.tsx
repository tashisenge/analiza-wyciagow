import Link from "next/link";

const PERIODS = [
  { key: "month", label: "Miesiąc" },
  { key: "quarter", label: "Kwartał" },
  { key: "year", label: "Rok" },
] as const;

export function DateRangeToggle({
  active,
  context,
}: {
  active: string;
  context: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((period) => (
        <Link
          key={period.key}
          href={`/dashboard?context=${context}&period=${period.key}`}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            active === period.key
              ? "bg-indigo-600 text-white"
              : "border bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
