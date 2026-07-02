import { AmountValue } from "@/components/privacy/AmountValue";
import type { DiscretionaryPersonRow } from "@/lib/discretionary/types";

interface DiscretionaryPersonBreakdownProps {
  rows: DiscretionaryPersonRow[];
}

export function DiscretionaryPersonBreakdown({
  rows,
}: DiscretionaryPersonBreakdownProps): React.JSX.Element | null {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="section-card">
      <h2 className="section-title">Kto ile (opcjonalne)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Na podstawie tagów Adam / Żona na transakcjach. Bez tagu trafia do „Bez tagu”.
      </p>
      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span className="font-medium text-slate-900">{row.name}</span>
            <span className="text-right text-slate-700">
              <AmountValue className="font-semibold">
                {row.totalPln.toFixed(2)} PLN
              </AmountValue>
              {row.shareOfDiscretionaryPercent !== null ? (
                <span className="ml-2 text-slate-500">
                  ({row.shareOfDiscretionaryPercent.toFixed(1)}% · {row.transactionCount}{" "}
                  tx)
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
