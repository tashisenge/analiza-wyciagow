import { prisma } from "@/lib/db";

export async function applyCategoryAssignments(
  assignments: Map<string, string>,
  byName: Map<string, string>,
  workspaceId: string,
): Promise<number> {
  let total = 0;
  for (const [txId, categoryName] of assignments) {
    const categoryId = byName.get(categoryName);
    if (!categoryId) {
      continue;
    }
    const updated = await prisma.transaction.updateMany({
      where: { id: txId, workspaceId },
      data: { categoryId, mbankReviewResolvedAt: null },
    });
    total += updated.count;
  }
  return total;
}
