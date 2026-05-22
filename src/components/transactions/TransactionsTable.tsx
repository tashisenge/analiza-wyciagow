import { CategoryAssignForm } from "@/components/transactions/CategoryAssignForm";

interface CategoryOption {
  id: string;
  name: string;
}

interface TransactionRow {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  mbankCategory: string;
  amount: { toString(): string };
  currency: string;
  categoryId: string | null;
  category: { name: string } | null;
  account: { type: string };
  similarCount: number;
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
  categories: CategoryOption[];
  returnTo: string;
  changeCategoryAction: (formData: FormData) => Promise<void>;
}

function formatAmount(amount: string, currency: string): string {
  const value = Number(amount);
  const formatted = Number.isFinite(value) ? value.toFixed(2) : amount;
  return `${formatted} ${currency}`;
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
            <th className="px-3 py-2">Operacja</th>
            <th className="px-3 py-2">Kwota</th>
            <th className="px-3 py-2">Konto</th>
            <th className="px-3 py-2">Podobne</th>
            <th className="px-3 py-2">Kategoria</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                Brak transakcji dla wybranych filtrów.
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b align-top last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  {tx.bookedAt.toISOString().slice(0, 10)}
                </td>
                <td className="max-w-xs px-3 py-2">
                  <p className="font-medium text-slate-900">{tx.counterparty || "—"}</p>
                  <p className="truncate text-xs text-slate-500" title={tx.description}>
                    {tx.description}
                  </p>
                  {tx.mbankCategory ? (
                    <p className="text-xs text-slate-400">mBank: {tx.mbankCategory}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatAmount(tx.amount.toString(), tx.currency)}
                </td>
                <td className="px-3 py-2 capitalize">{tx.account.type}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {tx.similarCount > 0 ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
                      +{String(tx.similarCount)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="min-w-[11rem] px-3 py-2">
                  {tx.category ? (
                    <p className="mb-1 text-xs text-emerald-700">{tx.category.name}</p>
                  ) : null}
                  <CategoryAssignForm
                    transactionId={tx.id}
                    categories={categories}
                    defaultCategoryId={tx.categoryId ?? ""}
                    similarCount={tx.similarCount}
                    counterparty={tx.counterparty}
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
