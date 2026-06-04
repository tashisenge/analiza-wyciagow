import { prisma } from "@/lib/db";
import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

interface PersistReviewDecisionInput {
  workspaceId: string;
  transactionId: string;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}

type PersistReviewDecisionResult = { ok: true } | { ok: false; error: string };

async function updateReviewCategory(
  workspaceId: string,
  transactionId: string,
  categoryId: string | null,
): Promise<boolean> {
  const result = await prisma.transaction.updateMany({
    where: { id: transactionId, workspaceId, mbankReviewResolvedAt: null },
    data: {
      categoryId,
      mbankReviewResolvedAt: new Date(),
    },
  });
  return result.count > 0;
}

async function loadReviewTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<{
  id: string;
  mbankCategory: string;
  categoryId: string | null;
} | null> {
  return prisma.transaction.findFirst({
    where: { id: transactionId, workspaceId },
    select: { id: true, mbankCategory: true, categoryId: true },
  });
}

async function persistResolvedCategory(
  workspaceId: string,
  transactionId: string,
  categoryId: string | null,
): Promise<PersistReviewDecisionResult> {
  const updated = await updateReviewCategory(workspaceId, transactionId, categoryId);
  if (!updated) {
    return { ok: false, error: "Transakcja nie wymaga weryfikacji" };
  }
  return { ok: true };
}

export async function persistReviewDecision(
  input: PersistReviewDecisionInput,
): Promise<PersistReviewDecisionResult> {
  const tx = await loadReviewTransaction(input.workspaceId, input.transactionId);
  if (!tx) {
    return { ok: false, error: "Nie znaleziono transakcji" };
  }

  const resolved = await resolveReviewCategoryId({
    workspaceId: input.workspaceId,
    tx,
    decision: input.decision,
    customCategoryId: input.categoryId,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  return persistResolvedCategory(input.workspaceId, tx.id, resolved.categoryId);
}
