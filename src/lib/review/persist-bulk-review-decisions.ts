import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import { prisma } from "@/lib/db";
import { persistReviewDecision } from "@/lib/review/persist-review-decision";

const BULK_REVIEW_MAX = 500;

export type BulkReviewDecision = "mbank" | "app" | "custom" | "ai";

interface BulkPersistInput {
  workspaceId: string;
  transactionIds: string[];
  decision: BulkReviewDecision;
  categoryId?: string;
  suggestionsById?: Record<string, MbankVerifySuggestion>;
  categoryIdByName: Map<string, string>;
}

function resolveBulkItemDecision(
  input: BulkPersistInput,
  transactionId: string,
):
  | { ok: true; decision: "mbank" | "app" | "custom"; categoryId?: string }
  | { ok: false; error: string } {
  if (input.decision !== "ai") {
    if (input.decision === "custom" && !input.categoryId) {
      return { ok: false, error: "Wybierz kategorię" };
    }
    return { ok: true, decision: input.decision, categoryId: input.categoryId };
  }

  const suggestion = input.suggestionsById?.[transactionId];
  if (!suggestion) {
    return { ok: false, error: "brak sugestii AI" };
  }
  const categoryId = input.categoryIdByName.get(suggestion.recommendedCategory);
  if (!categoryId) {
    return { ok: false, error: `brak kategorii «${suggestion.recommendedCategory}»` };
  }
  return { ok: true, decision: "custom", categoryId };
}

async function persistOneBulkItem(
  input: BulkPersistInput,
  transactionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resolved = resolveBulkItemDecision(input, transactionId);
  if (!resolved.ok) {
    return { ok: false, error: `${transactionId}: ${resolved.error}` };
  }

  const result = await persistReviewDecision({
    workspaceId: input.workspaceId,
    transactionId,
    decision: resolved.decision,
    categoryId: resolved.categoryId,
  });

  if (!result.ok) {
    return { ok: false, error: `${transactionId}: ${result.error}` };
  }
  return { ok: true };
}

async function countBulkUpdates(
  input: BulkPersistInput,
  ids: string[],
): Promise<{ updatedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let updatedCount = 0;
  for (const transactionId of ids) {
    const outcome = await persistOneBulkItem(input, transactionId);
    if (outcome.ok) {
      updatedCount += 1;
      continue;
    }
    errors.push(outcome.error);
  }
  return { updatedCount, errors };
}

export async function persistBulkReviewDecisions(
  input: BulkPersistInput,
): Promise<
  | { ok: true; updatedCount: number; failedCount: number; errors: string[] }
  | { ok: false; error: string }
> {
  const ids = input.transactionIds.slice(0, BULK_REVIEW_MAX);
  if (ids.length === 0) {
    return { ok: false, error: "Brak zaznaczonych transakcji" };
  }

  const { updatedCount, errors } = await countBulkUpdates(input, ids);
  return {
    ok: true,
    updatedCount,
    failedCount: ids.length - updatedCount,
    errors: errors.slice(0, 5),
  };
}

export async function loadCategoryIdByName(
  workspaceId: string,
): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });
  return new Map(categories.map((category) => [category.name, category.id]));
}
