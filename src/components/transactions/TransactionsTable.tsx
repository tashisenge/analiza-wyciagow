import { AmountValue } from "@/components/privacy/AmountValue";
import { CategoryAssignForm } from "@/components/transactions/CategoryAssignForm";

interface CategoryOption {
  id: string;
  name: string;
}

interface SimilarCounts {
  byCounterparty: number;
  byCounterpartyAndAmount: number;
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
  suggestedCategoryId: string;
  category: { name: string } | null;
  account: { type: string };
  similarCounts: SimilarCounts;
  isOwnAccountTransfer: boolean;
  transferPairHint: string | null;
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

function renderSimilarBadges(counts: SimilarCounts): React.JSX.Element {
  if (counts.byCounterparty === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="rounded-lg bg-accent-50 px-2 py-0.5 text-xs text-accent-600">
        +{String(counts.byCounterparty)} kontrahent
      </span>
      {counts.byCounterpartyAndAmount > 0 ? (
        <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs text-brand-800">
          +{String(counts.byCounterpartyAndAmount)} kwota
        </span>
      ) : null}
    </div>
  );
}

export function TransactionsTable({
  transactions,
  categories,
  returnTo,
  changeCategoryAction,
}: TransactionsTableProps): React.JSX.Element {
  return (
    <div className="section-card overflow-x-auto p-0">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-calm-200 bg-calm-50">
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
            transactions.map((tx) => {
              const amountLabel = formatAmount(tx.amount.toString(), tx.currency);
              return (
                <tr key={tx.id} className="border-b align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {tx.bookedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    {tx.isOwnAccountTransfer ? (
                      <span className="mb-1 inline-block rounded-lg bg-brand-100 px-2 py-0.5 text-xs text-brand-900">
                        Transfer między kontami
                      </span>
                    ) : null}
                    <p className="font-medium text-slate-900">{tx.counterparty || "—"}</p>
                    <p className="truncate text-xs text-slate-500" title={tx.description}>
                      {tx.description}
                    </p>
                    {tx.transferPairHint ? (
                      <p className="text-xs text-brand-700">{tx.transferPairHint}</p>
                    ) : null}
                    {tx.mbankCategory ? (
                      <p className="text-xs text-slate-400">mBank: {tx.mbankCategory}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <AmountValue>{amountLabel}</AmountValue>
                  </td>
                  <td className="px-3 py-2 capitalize">{tx.account.type}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {tx.isOwnAccountTransfer ? (
                      <span className="text-xs text-slate-400">transfer</span>
                    ) : (
                      renderSimilarBadges(tx.similarCounts)
                    )}
                  </td>
                  <td className="min-w-[11rem] px-3 py-2">
                    {tx.category ? (
                      <p className="mb-1 text-xs font-medium text-brand-700">
                        {tx.category.name}
                      </p>
                    ) : null}
                    <CategoryAssignForm
                      transactionId={tx.id}
                      categories={categories}
                      defaultCategoryId={tx.suggestedCategoryId}
                      similarCounts={tx.similarCounts}
                      counterparty={tx.counterparty}
                      amountLabel={amountLabel}
                      isOwnAccountTransfer={tx.isOwnAccountTransfer}
                      hasCategory={Boolean(tx.categoryId)}
                      action={changeCategoryAction}
                      returnTo={returnTo}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
