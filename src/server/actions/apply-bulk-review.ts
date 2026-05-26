import { z } from "zod";

import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import {
  loadCategoryIdByName,
  persistBulkReviewDecisions,
  type BulkReviewDecision,
} from "@/lib/review/persist-bulk-review-decisions";

export const bulkDecisionSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1).max(500),
  decision: z.enum(["mbank", "app", "custom", "ai"]),
  categoryId: z.string().optional(),
  suggestions: z
    .record(
      z.string(),
      z.object({
        recommendedCategory: z.string(),
        reason: z.string(),
        prefer: z.enum(["mbank", "app"]),
      }),
    )
    .optional(),
});

export function bulkSuccessMessage(updatedCount: number, failedCount: number): string {
  const failedNote = failedCount > 0 ? ` (${String(failedCount)} nieudanych)` : "";
  return `Zaktualizowano ${String(updatedCount)} transakcji${failedNote}`;
}

export async function runBulkReviewDecisions(
  workspaceId: string,
  input: {
    transactionIds: string[];
    decision: BulkReviewDecision;
    categoryId?: string;
    suggestions?: Record<string, MbankVerifySuggestion>;
  },
): Promise<
  | { ok: true; message: string; updatedCount: number; failedCount: number }
  | { ok: false; error: string }
> {
  const parsed = bulkDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  if (parsed.data.decision === "custom" && !parsed.data.categoryId) {
    return { ok: false, error: "Wybierz kategorię docelową" };
  }

  const categoryIdByName = await loadCategoryIdByName(workspaceId);
  const result = await persistBulkReviewDecisions({
    workspaceId,
    transactionIds: parsed.data.transactionIds,
    decision: parsed.data.decision,
    categoryId: parsed.data.categoryId,
    suggestionsById: parsed.data.suggestions,
    categoryIdByName,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (result.updatedCount === 0) {
    const firstError = result.errors[0] ?? "";
    const detail = firstError ? `: ${firstError}` : "";
    return { ok: false, error: `Nie zaktualizowano żadnej transakcji${detail}` };
  }

  return {
    ok: true,
    message: bulkSuccessMessage(result.updatedCount, result.failedCount),
    updatedCount: result.updatedCount,
    failedCount: result.failedCount,
  };
}
