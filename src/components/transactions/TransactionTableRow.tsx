import { AmountValue } from "@/components/privacy/AmountValue";
import { CategoryAssignForm } from "@/components/transactions/CategoryAssignForm";
import { SubscriptionToggle } from "@/components/transactions/SubscriptionToggle";
import { TransactionTagsForm } from "@/components/transactions/TransactionTagsForm";

export interface TransactionTableRowData {
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
  similarCounts: {
    byCounterparty: number;
    byCounterpartyAndAmount: number;
  };
  isOwnAccountTransfer: boolean;
  transferPairHint: string | null;
  tags: { id: string; name: string; color: string }[];
  isSubscription: boolean;
}

interface TransactionTableRowProps {
  tx: TransactionTableRowData;
  categories: { id: string; name: string }[];
  allTags: { id: string; name: string; color: string }[];
  candidateTransactionIds: string[];
  returnTo: string;
  changeCategoryAction: (formData: FormData) => Promise<void>;
  selected: boolean;
  showSelection: boolean;
  onToggleSelect?: (id: string) => void;
}

function formatAmount(amount: string, currency: string): string {
  const value = Number(amount);
  const formatted = Number.isFinite(value) ? value.toFixed(2) : amount;
  return `${formatted} ${currency}`;
}

function renderSimilarBadges(
  counts: TransactionTableRowData["similarCounts"],
): React.JSX.Element {
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

export function TransactionTableRow({
  tx,
  categories,
  allTags,
  candidateTransactionIds,
  returnTo,
  changeCategoryAction,
  selected,
  showSelection,
  onToggleSelect,
}: TransactionTableRowProps): React.JSX.Element {
  const amountLabel = formatAmount(tx.amount.toString(), tx.currency);

  return (
    <tr className="border-b align-top last:border-0">
      {showSelection ? (
        <td className="px-3 py-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {
              onToggleSelect?.(tx.id);
            }}
            aria-label={`Zaznacz ${tx.counterparty || tx.description}`}
          />
        </td>
      ) : null}
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
        <SubscriptionToggle counterparty={tx.counterparty} isMarked={tx.isSubscription} />
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
          <p className="mb-1 text-xs font-medium text-brand-700">{tx.category.name}</p>
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
          candidateTransactionIds={candidateTransactionIds}
          action={changeCategoryAction}
          returnTo={returnTo}
        />
      </td>
      <td className="min-w-[10rem] px-3 py-2">
        {tx.tags.length > 0 ? (
          <div className="mb-1 flex flex-wrap gap-1">
            {tx.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}
        <TransactionTagsForm
          transactionId={tx.id}
          allTags={allTags}
          selectedTagIds={tx.tags.map((tag) => tag.id)}
        />
      </td>
    </tr>
  );
}
