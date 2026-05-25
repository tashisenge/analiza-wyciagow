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

interface ReviewQueueActionsProps {
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

function statusMessageClass(type: RowMessage["type"]): string {
  return type === "success" ? "alert-success text-xs" : "text-xs text-red-700";
}

export function ReviewQueueActions({
  item,
  suggestion,
  categories,
  customCategoryId,
  pending,
  rowMessage,
  onCustomCategoryChange,
  onDecision,
  onError,
}: ReviewQueueActionsProps): React.JSX.Element {
  function acceptAiSuggestion(): void {
    if (!suggestion) {
      return;
    }
    const category = categories.find((cat) => cat.name === suggestion.recommendedCategory);
    if (!category) {
      onError(`Brak kategorii „${suggestion.recommendedCategory}” w aplikacji`);
      return;
    }
    onDecision(item.id, "custom", category.id);
  }

  return (
    <div className="flex flex-col gap-1">
      {pending ? <p className="text-xs font-medium text-brand-700">Zapisywanie…</p> : null}
      {rowMessage ? (
        <p className={statusMessageClass(rowMessage.type)} role="status">
          {rowMessage.text}
        </p>
      ) : null}
      {suggestion ? (
        <button
          type="button"
          disabled={pending}
          className="btn-primary text-xs disabled:opacity-60"
          onClick={acceptAiSuggestion}
        >
          Zaakceptuj sugestię AI
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        className="btn-secondary text-xs disabled:opacity-60"
        onClick={() => {
          onDecision(item.id, "mbank");
        }}
      >
        Zaakceptuj mBank
      </button>
      <button
        type="button"
        disabled={pending || !item.categoryId}
        className="btn-secondary text-xs disabled:opacity-60"
        onClick={() => {
          onDecision(item.id, "app");
        }}
      >
        Zaakceptuj app
      </button>
      <div className="flex gap-1">
        <select
          value={customCategoryId}
          disabled={pending}
          onChange={(event) => {
            onCustomCategoryChange(event.target.value);
          }}
          className="input-field flex-1 text-xs disabled:opacity-60"
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
          className="btn-primary text-xs disabled:opacity-60"
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
        className="text-xs text-slate-500 underline disabled:opacity-60"
        onClick={() => {
          onDecision(item.id, "skip");
        }}
      >
        Pomiń
      </button>
    </div>
  );
}
