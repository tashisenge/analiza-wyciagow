import { AmountValue } from "@/components/privacy/AmountValue";
import { ReviewQueueActions } from "@/components/review/ReviewQueueActions";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

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
  rowMessage?: RowMessage;
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
  rowMessage,
  onCustomCategoryChange,
  onDecision,
  onError,
}: ReviewQueueRowProps): React.JSX.Element {
  const amountLabel = `${item.amount} ${item.currency}`;

  return (
    <tr className={rowClassName(pending, rowMessage)}>
      <td className="px-3 py-2 whitespace-nowrap">
        {item.bookedAt.toISOString().slice(0, 10)}
      </td>
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
            <p className="font-medium text-brand-800">
              → {suggestion.recommendedCategory}
            </p>
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
