import type { MerchantRow } from "@/lib/analytics/top-merchants";

interface MerchantListProps {
  merchants: MerchantRow[];
}

export function MerchantList({ merchants }: MerchantListProps): React.JSX.Element {
  return (
    <ul className="space-y-2">
      {merchants.map((row) => (
        <li
          key={row.counterparty}
          className="flex justify-between rounded border bg-white px-3 py-2 text-sm"
        >
          <span>{row.counterparty}</span>
          <span>
            {row.total.toFixed(2)} PLN
            {row.changePercent !== null ? ` (${String(row.changePercent)}% m/m)` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
