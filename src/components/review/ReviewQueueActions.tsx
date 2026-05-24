import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewQueueActionsProps {
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

export function ReviewQueueActions({
  item,
  suggestion,
  categories,
  customCategoryId,
  pending,
  onCustomCategoryChange,
  onDecision,
}: ReviewQueueActionsProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      {suggestion ? (
        <button
          type="button"
          disabled={pending}
          className="btn-primary text-xs"
          onClick={() => {
            const category = categories.find(
              (cat) => cat.name === suggestion.recommendedCategory,
            );
            if (!category) {
              return;
            }
            onDecision(item.id, "custom", category.id);
          }}
        >
          Zaakceptuj sugestię AI
        </button>
      ) : null}
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
  );
}
