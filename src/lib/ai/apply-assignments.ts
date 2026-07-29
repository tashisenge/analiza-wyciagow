import { AI_UNCATEGORIZED_CATEGORY_NAMES } from "@/lib/ai/ai-target-transactions";
import { prisma } from "@/lib/db";

/**
 * Zapisuje przypisania AI tylko na transakcjach nadal bez sensownej kategorii app.
 * Chroni przed nadpisaniem ręcznej kategorii (również gdy mBank ma „Bez kategorii”).
 */
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
      where: {
        id: txId,
        workspaceId,
        OR: [
          { categoryId: null },
          { category: { name: { in: [...AI_UNCATEGORIZED_CATEGORY_NAMES] } } },
        ],
      },
      data: { categoryId },
    });
    total += updated.count;
  }
  return total;
}
