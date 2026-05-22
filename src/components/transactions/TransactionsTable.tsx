import { CategorySelect } from "@/components/transactions/CategorySelect";

interface CategoryOption {
  id: string;
  name: string;
}

interface TransactionRow {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString(): string };
  categoryId: string | null;
  account: { type: string };
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  categories: CategoryOption[];
  returnTo: string;
  changeCategoryAction: (formData: FormData) => Promise<void>;
}

export function TransactionsTable({
  transactions,
  categories,
  returnTo,
  changeCategoryAction,
}: TransactionsTableProps): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Kontrahent</th>
            <th className="px-3 py-2">Kwota</th>
            <th className="px-3 py-2">Konto</th>
            <th className="px-3 py-2">Kategoria</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                Brak transakcji dla wybranych filtrów.
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  {tx.bookedAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2">
                  {tx.counterparty || tx.description.slice(0, 40)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {tx.amount.toString()} PLN
                </td>
                <td className="px-3 py-2">{tx.account.type}</td>
                <td className="px-3 py-2">
                  <CategorySelect
                    transactionId={tx.id}
                    categories={categories}
                    defaultCategoryId={tx.categoryId ?? ""}
                    action={changeCategoryAction}
                    returnTo={returnTo}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
