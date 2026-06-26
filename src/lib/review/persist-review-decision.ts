import { prisma } from "@/lib/db";
import { isReviewRow } from "@/lib/review/build-review-queue-where";
import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

type PersistReviewResult = { ok: true } | { ok: false; error: string };

interface PersistReviewInput {
  workspaceId: string;
  transactionId: string;
  decision: "mbank" | "app" | "custom";
  categoryId?: string;
}

interface ReviewTransaction {
  id: string;
  mbankCategory: string;
  categoryId: string | null;
  mbankReviewResolvedAt: Date | null;
  category: { name: string } | null;
}

async function findReviewTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ReviewTransaction | null> {
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

function transactionNeedsReview(tx: ReviewTransaction): boolean {
  return isReviewRow({
    mbankCategory: tx.mbankCategory,
    categoryId: tx.categoryId,
    categoryName: tx.category?.name ?? null,
    mbankReviewResolvedAt: tx.mbankReviewResolvedAt,
  });
}

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

function validateReviewTransaction(
  tx: ReviewTransaction | null,
): { tx: ReviewTransaction } | { error: string } {
  if (!tx) {
    return { error: "Nie znaleziono transakcji" };
  }
  if (!transactionNeedsReview(tx)) {
    return { error: "Transakcja nie wymaga weryfikacji" };
  }
  return { tx };
}

async function persistResolvedDecision(
  input: PersistReviewInput,
  tx: ReviewTransaction,
): Promise<PersistReviewResult> {
  const resolved = await resolveReviewCategoryId({
    workspaceId: input.workspaceId,
    tx,
    decision: input.decision,
    customCategoryId: input.categoryId,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const updated = await updateReviewCategory(
    input.workspaceId,
    tx.id,
    resolved.categoryId,
  );
  if (!updated) {
    return { ok: false, error: "Transakcja została już zweryfikowana" };
  }
  return { ok: true };
}

export async function persistReviewDecision(
  input: PersistReviewInput,
): Promise<PersistReviewResult> {
  const validated = validateReviewTransaction(
    await findReviewTransaction(input.workspaceId, input.transactionId),
  );
  if ("error" in validated) {
    return { ok: false, error: validated.error };
  }
  return persistResolvedDecision(input, validated.tx);
}
