import { prisma } from "@/lib/db";
import { isReviewRow } from "@/lib/review/build-review-queue-where";
import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

interface ReviewDecisionInput {
  workspaceId: string;
  transactionId: string;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}

interface ReviewDecisionTx {
  id: string;
  mbankCategory: string;
  categoryId: string | null;
  mbankReviewResolvedAt: Date | null;
  category: { name: string } | null;
}

type ReviewDecisionResult = { ok: true } | { ok: false; error: string };

function isCurrentReviewRow(tx: ReviewDecisionTx): boolean {
  return isReviewRow({
    mbankCategory: tx.mbankCategory,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
    mbankReviewResolvedAt: tx.mbankReviewResolvedAt,
  });
}

async function loadReviewTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ReviewDecisionTx | null> {
  return prisma.transaction.findFirst({
    where: { id: transactionId, workspaceId },
    select: {
      id: true,
      mbankCategory: true,
      categoryId: true,
      mbankReviewResolvedAt: true,
      category: { select: { name: true } },
    },
  });
}

async function updateReviewCategory(
  workspaceId: string,
  tx: { id: string; categoryId: string | null; mbankCategory: string },
  categoryId: string | null,
): Promise<boolean> {
  const result = await prisma.transaction.updateMany({
    where: {
      id: tx.id,
      workspaceId,
      mbankReviewResolvedAt: null,
      categoryId: tx.categoryId,
      mbankCategory: tx.mbankCategory,
    },
    data: {
      categoryId,
      mbankReviewResolvedAt: new Date(),
    },
  });
  return result.count === 1;
}

async function resolveDecisionCategory(
  input: ReviewDecisionInput,
  tx: ReviewDecisionTx,
): Promise<{ ok: true; categoryId: string | null } | { ok: false; error: string }> {
  return resolveReviewCategoryId({
    workspaceId: input.workspaceId,
    tx,
    decision: input.decision,
    customCategoryId: input.categoryId,
  });
}

async function storeReviewDecision(
  input: ReviewDecisionInput,
  tx: ReviewDecisionTx,
  categoryId: string | null,
): Promise<ReviewDecisionResult> {
  const updated = await updateReviewCategory(input.workspaceId, tx, categoryId);
  if (!updated) {
    return {
      ok: false,
      error: "Transakcja została już zmieniona. Odśwież widok weryfikacji.",
    };
  }
  return { ok: true };
}

export async function persistReviewDecision(
  input: ReviewDecisionInput,
): Promise<ReviewDecisionResult> {
  const tx = await loadReviewTransaction(input.workspaceId, input.transactionId);
  if (!tx) {
    return { ok: false, error: "Nie znaleziono transakcji" };
  }

  if (!isCurrentReviewRow(tx)) {
    return { ok: false, error: "Transakcja nie wymaga już weryfikacji" };
  }

  const resolved = await resolveDecisionCategory(input, tx);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  return storeReviewDecision(input, tx, resolved.categoryId);
}
