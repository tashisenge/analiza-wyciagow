import {
  TransactionTableRow,
  type TransactionTableRowData,
} from "@/components/transactions/TransactionTableRow";

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TransactionsTableProps {
  transactions: TransactionTableRowData[];
  categories: { id: string; name: string }[];
  allTags: TagOption[];
  returnTo: string;
  changeCategoryAction: (formData: FormData) => Promise<void>;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  categories,
  allTags,
  returnTo,
  changeCategoryAction,
  selectedIds = [],
  onToggleSelect,
}: TransactionsTableProps): React.JSX.Element {
  const showSelection = Boolean(onToggleSelect);
  const colSpan = showSelection ? 8 : 7;

  return (
    <div className="section-card overflow-x-auto p-0">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-calm-200 bg-calm-50">
          <tr>
            {showSelection ? (
              <th className="px-3 py-2" aria-label="Zaznacz">
                ✓
              </th>
            ) : null}
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Operacja</th>
            <th className="px-3 py-2">Kwota</th>
            <th className="px-3 py-2">Konto</th>
            <th className="px-3 py-2">Podobne</th>
            <th className="px-3 py-2">Kategoria</th>
            <th className="px-3 py-2">Tagi</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-3 py-6 text-center text-slate-500">
                Brak transakcji dla wybranych filtrów.
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <TransactionTableRow
                key={tx.id}
                tx={tx}
                categories={categories}
                allTags={allTags}
                returnTo={returnTo}
                changeCategoryAction={changeCategoryAction}
                selected={selectedIds.includes(tx.id)}
                showSelection={showSelection}
                onToggleSelect={onToggleSelect}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
