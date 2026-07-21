import { TransactionsTableHead } from "@/components/transactions/TransactionsTableHead";
import {
  TransactionTableRow,
  type TransactionTableRowData,
} from "@/components/transactions/TransactionTableRow";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

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
  listParams: TransactionSearchParams;
  changeCategoryAction: (formData: FormData) => Promise<void>;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  categories,
  allTags,
  returnTo,
  listParams,
  changeCategoryAction,
  selectedIds = [],
  onToggleSelect,
}: TransactionsTableProps): React.JSX.Element {
  const showSelection = Boolean(onToggleSelect);
  const colSpan = showSelection ? 8 : 7;
  const candidateTransactionIds = transactions.map((transaction) => transaction.id);

  return (
    <div className="section-card overflow-x-auto p-0">
      <table className="min-w-full text-left text-sm">
        <TransactionsTableHead showSelection={showSelection} params={listParams} />
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
                candidateTransactionIds={candidateTransactionIds}
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
