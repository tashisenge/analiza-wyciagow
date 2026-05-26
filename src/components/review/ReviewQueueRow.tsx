import { AmountValue } from "@/components/privacy/AmountValue";
import { ReviewQueueActions } from "@/components/review/ReviewQueueActions";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import { getReviewReason, REVIEW_REASON_LABELS } from "@/lib/review/review-queue-filters";

interface CategoryOption {
  id: string;
  name: string;
}

interface RowMessage {
  type: "success" | "error";
  text: string;
}

interface ReviewQueueRowProps {
  item: ReviewQueueItem;
  suggestion: MbankVerifySuggestion | undefined;
  categories: CategoryOption[];
  customCategoryId: string;
  pending: boolean;
  selected: boolean;
  showSelection: boolean;
  rowMessage?: RowMessage;
  onToggleSelect?: (id: string) => void;
  onCustomCategoryChange: (categoryId: string) => void;
  onDecision: (
    transactionId: string,
    decision: "mbank" | "app" | "custom" | "skip",
    categoryId?: string,
  ) => void;
  onError: (message: string) => void;
}

function rowClassName(pending: boolean, rowMessage?: RowMessage): string {
  const base = "border-b align-top transition-colors duration-200 last:border-0";
  if (pending) {
    return `${base} bg-brand-50/60`;
  }
  if (rowMessage?.type === "success") {
    return `${base} bg-emerald-50/70`;
  }
  if (rowMessage?.type === "error") {
    return `${base} bg-red-50/70`;
  }
  return base;
}

export function ReviewQueueRow({
  item,
  suggestion,
  categories,
  customCategoryId,
  pending,
  selected,
  showSelection,
  rowMessage,
  onToggleSelect,
  onCustomCategoryChange,
  onDecision,
  onError,
}: ReviewQueueRowProps): React.JSX.Element {
  const amountLabel = `${item.amount} ${item.currency}`;
  const reason = getReviewReason(item);

  return (
    <tr className={rowClassName(pending, rowMessage)}>
      {showSelection ? (
        <td className="px-3 py-2">
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Zaznacz ${item.counterparty || item.id}`}
            onChange={() => {
              onToggleSelect?.(item.id);
            }}
          />
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 py-2">
        {item.bookedAt.toISOString().slice(0, 10)}
      </td>
      <td className="max-w-xs px-3 py-2">
        <p className="font-medium">{item.counterparty || "—"}</p>
        <p className="truncate text-xs text-slate-500">{item.description}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs">
        <AmountValue>{amountLabel}</AmountValue>
      </td>
      <td className="px-3 py-2">{item.mbankCategory || "—"}</td>
      <td className="px-3 py-2">{item.categoryName ?? "—"}</td>
      <td className="max-w-xs px-3 py-2 text-xs text-slate-600">
        {suggestion ? (
          <>
            <p className="font-medium text-brand-800">
              → {suggestion.recommendedCategory}
            </p>
            <p>{suggestion.reason}</p>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {REVIEW_REASON_LABELS[reason]}
        </span>
      </td>
      <td className="min-w-[14rem] px-3 py-2">
        <ReviewQueueActions
          item={item}
          suggestion={suggestion}
          categories={categories}
          customCategoryId={customCategoryId}
          pending={pending}
          rowMessage={rowMessage}
          onCustomCategoryChange={onCustomCategoryChange}
          onDecision={onDecision}
          onError={onError}
        />
      </td>
    </tr>
  );
}
