import { prisma } from "@/lib/db";
import { isReviewRow } from "@/lib/review/build-review-queue-where";
import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

interface ReviewDecisionTransaction {
  id: string;
  mbankCategory: string;
  categoryId: string | null;
  mbankReviewResolvedAt: Date | null;
  category: { name: string } | null;
}

async function loadReviewTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ReviewDecisionTransaction | null> {
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

async function resolveAndUpdateReviewCategory(input: {
  workspaceId: string;
  tx: ReviewDecisionTransaction;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resolved = await resolveReviewCategoryId({
    workspaceId: input.workspaceId,
    tx: input.tx,
    decision: input.decision,
    customCategoryId: input.categoryId,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const updated = await updateReviewCategory(
    input.workspaceId,
    input.tx,
    resolved.categoryId,
  );
  if (!updated) {
    return { ok: false, error: "Transakcja została już rozstrzygnięta" };
  }
  return { ok: true };
}

function transactionNeedsReview(tx: ReviewDecisionTransaction): boolean {
  return isReviewRow({
    mbankCategory: tx.mbankCategory,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
    mbankReviewResolvedAt: tx.mbankReviewResolvedAt,
  });
}

async function updateReviewCategory(
  workspaceId: string,
  tx: ReviewDecisionTransaction,
  categoryId: string | null,
): Promise<boolean> {
  const result = await prisma.transaction.updateMany({
    where: {
      id: tx.id,
      workspaceId,
      categoryId: tx.categoryId,
      mbankCategory: tx.mbankCategory,
      mbankReviewResolvedAt: null,
    },
    data: {
      categoryId,
      mbankReviewResolvedAt: new Date(),
    },
  });
  return result.count > 0;
}

export async function persistReviewDecision(input: {
  workspaceId: string;
  transactionId: string;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const tx = await loadReviewTransaction(input.workspaceId, input.transactionId);
  if (!tx) {
    return { ok: false, error: "Nie znaleziono transakcji" };
  }
  if (!transactionNeedsReview(tx)) {
    return { ok: false, error: "Transakcja nie wymaga już weryfikacji" };
  }
  return resolveAndUpdateReviewCategory({
    workspaceId: input.workspaceId,
    tx,
    decision: input.decision,
    categoryId: input.categoryId,
  });
}
