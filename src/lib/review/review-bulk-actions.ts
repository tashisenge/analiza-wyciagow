import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { BulkReviewDecision } from "@/lib/review/persist-bulk-review-decisions";
import { applyBulkReviewDecisions } from "@/server/actions/review";

export function suggestionsForIds(
  selectedIds: string[],
  suggestions: Record<string, MbankVerifySuggestion>,
): Record<string, MbankVerifySuggestion> {
  const entries = selectedIds.flatMap((id) => {
    const suggestion = suggestions[id];
    return suggestion ? [[id, suggestion] as const] : [];
  });
  return Object.fromEntries(entries);
}

export async function submitBulkReview(input: {
  selectedIds: string[];
  decision: BulkReviewDecision;
  categoryId: string;
  aiSuggestions: Record<string, MbankVerifySuggestion>;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const result = await applyBulkReviewDecisions({
    transactionIds: input.selectedIds,
    decision: input.decision,
    categoryId: input.decision === "custom" ? input.categoryId : undefined,
    suggestions: input.decision === "ai" ? input.aiSuggestions : undefined,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, message: result.message };
}
