import { AmountValue } from "@/components/privacy/AmountValue";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewQueueRowProps {
  item: ReviewQueueItem;
  suggestion: MbankVerifySuggestion | undefined;
  categories: CategoryOption[];
  customCategoryId: string;
  pending: boolean;
  onCustomCategoryChange: (categoryId: string) => void;
  onDecision: (
    transactionId: string,
    decision: "mbank" | "app" | "custom" | "skip",
    categoryId?: string,
  ) => void;
}

export function ReviewQueueRow({
  item,
  suggestion,
  categories,
  customCategoryId,
  pending,
  onCustomCategoryChange,
  onDecision,
}: ReviewQueueRowProps): React.JSX.Element {
  const amountLabel = `${item.amount} ${item.currency}`;

  return (
    <tr className="border-b align-top last:border-0">
      <td className="px-3 py-2 whitespace-nowrap">{item.bookedAt.toISOString().slice(0, 10)}</td>
      <td className="max-w-xs px-3 py-2">
        <p className="font-medium">{item.counterparty || "—"}</p>
        <p className="truncate text-xs text-slate-500">{item.description}</p>
        <p className="text-xs text-slate-600">
          <AmountValue>{amountLabel}</AmountValue>
        </p>
      </td>
      <td className="px-3 py-2">{item.mbankCategory || "—"}</td>
      <td className="px-3 py-2">{item.categoryName ?? "—"}</td>
      <td className="max-w-xs px-3 py-2 text-xs text-slate-600">
        {suggestion ? (
          <>
            <p className="font-medium text-brand-800">→ {suggestion.recommendedCategory}</p>
            <p>{suggestion.reason}</p>
            <p className="text-slate-500">
              Preferuje: {suggestion.prefer === "mbank" ? "mBank" : "app"}
            </p>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="min-w-[14rem] px-3 py-2">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={pending}
            className="btn-secondary text-xs"
            onClick={() => {
              onDecision(item.id, "mbank");
            }}
          >
            Zaakceptuj mBank
          </button>
          <button
            type="button"
            disabled={pending || !item.categoryId}
            className="btn-secondary text-xs"
            onClick={() => {
              onDecision(item.id, "app");
            }}
          >
            Zaakceptuj app
          </button>
          <div className="flex gap-1">
            <select
              value={customCategoryId}
              onChange={(event) => {
                onCustomCategoryChange(event.target.value);
              }}
              className="input-field flex-1 text-xs"
              aria-label="Inna kategoria"
            >
              <option value="">— inna —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !customCategoryId}
              className="btn-primary text-xs"
              onClick={() => {
                onDecision(item.id, "custom", customCategoryId);
              }}
            >
              OK
            </button>
          </div>
          <button
            type="button"
            disabled={pending}
            className="text-xs text-slate-500 underline"
            onClick={() => {
              onDecision(item.id, "skip");
            }}
          >
            Pomiń
          </button>
        </div>
      </td>
    </tr>
  );
}
