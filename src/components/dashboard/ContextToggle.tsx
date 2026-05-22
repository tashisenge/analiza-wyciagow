import Link from "next/link";

import type { ContextFilter } from "@/lib/analytics/filters";

const CONTEXTS: ContextFilter[] = ["razem", "dom", "firma"];

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
    <div className="flex gap-2">
      {CONTEXTS.map((value) => (
        <Link
          key={value}
          href={`${basePath}?context=${value}${query}`}
          className={`rounded px-3 py-1 text-sm capitalize ${
            active === value ? "bg-indigo-600 text-white" : "bg-slate-200"
          }`}
        >
          {value}
        </Link>
      ))}
    </div>
  );
}
