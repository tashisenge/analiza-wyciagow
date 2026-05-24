import { prisma } from "@/lib/db";
import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

async function updateReviewCategory(
  workspaceId: string,
  transactionId: string,
  categoryId: string | null,
): Promise<void> {
  await prisma.transaction.updateMany({
    where: { id: transactionId, workspaceId },
    data: { categoryId },
  });
}

export async function persistReviewDecision(input: {
  workspaceId: string;
  transactionId: string;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const tx = await prisma.transaction.findFirst({
    where: { id: input.transactionId, workspaceId: input.workspaceId },
    select: { id: true, mbankCategory: true, categoryId: true },
  });
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

  await updateReviewCategory(input.workspaceId, tx.id, resolved.categoryId);
  return { ok: true };
}
