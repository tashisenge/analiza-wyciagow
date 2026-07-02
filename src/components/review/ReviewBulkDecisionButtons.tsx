import type { BulkReviewDecision } from "@/lib/review/persist-bulk-review-decisions";

interface ReviewBulkDecisionButtonsProps {
  pending: boolean;
  aiCount: number;
  onDecision: (decision: BulkReviewDecision) => void;
}

export function ReviewBulkDecisionButtons({
  pending,
  aiCount,
  onDecision,
}: ReviewBulkDecisionButtonsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="btn-secondary text-xs"
        onClick={() => {
          onDecision("mbank");
        }}
      >
        Zaakceptuj mBank
      </button>
      <button
        type="button"
        disabled={pending}
        className="btn-secondary text-xs"
        onClick={() => {
          onDecision("app");
        }}
      >
        Zaakceptuj app
      </button>
      <button
        type="button"
        disabled={pending || aiCount === 0}
        className="btn-secondary text-xs"
        onClick={() => {
          onDecision("ai");
        }}
      >
        Zastosuj AI ({String(aiCount)})
      </button>
    </div>
  );
}
