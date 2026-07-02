import Link from "next/link";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { DiscretionaryMerchantRow } from "@/lib/discretionary/types";

interface DiscretionaryMerchantsTableProps {
  merchants: DiscretionaryMerchantRow[];
  context: string;
}

export function DiscretionaryMerchantsTable({
  merchants,
  context,
}: DiscretionaryMerchantsTableProps): React.JSX.Element {
  return (
    <section className="section-card">
      <h2 className="section-title">Top kontrahenci (opcjonalne)</h2>
      {merchants.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Brak wydatków opcjonalnych w tym okresie.
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Kontrahent</th>
              <th className="py-2 pr-4">Kwota</th>
              <th className="py-2 pr-4">Zmiana m/m</th>
              <th className="py-2">Transakcje</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((row) => (
              <tr key={row.counterparty} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {row.counterparty}
                </td>
                <td className="py-2 pr-4">
                  <AmountValue>{row.totalPln.toFixed(2)} PLN</AmountValue>
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  {row.vsPreviousPeriodPercent !== null
                    ? `${row.vsPreviousPeriodPercent > 0 ? "+" : ""}${row.vsPreviousPeriodPercent.toFixed(1)}%`
                    : "—"}
                </td>
                <td className="py-2">
                  <Link
                    href={`/transactions?context=${context}&counterparty=${encodeURIComponent(row.counterparty)}&discretionary=1`}
                    className="link-brand"
                  >
                    Lista →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-4">
        <Link
          href={`/transactions?context=${context}&discretionary=1`}
          className="link-brand text-sm"
        >
          Wszystkie transakcje opcjonalne →
        </Link>
      </p>
    </section>
  );
}
