import {
  deleteEmptyOrphanCategories,
  ensureCanonicalCategories,
} from "@/lib/categories/ensure-canonical-categories";
import { resolveCategoryId } from "@/lib/categorization/resolve-category";
import { prisma } from "@/lib/db";

export async function buildCategoriesByName(
  workspaceId: string,
): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({ where: { workspaceId } });
  return new Map(categories.map((category) => [category.name, category.id]));
}

/** Upewnia się, że istnieją kanoniczne kategorie (bez tworzenia 1:1 z mBank). */
export async function syncMbankCategories(
  workspaceId: string,
  _rawMbankNames?: string[],
): Promise<Map<string, string>> {
  await ensureCanonicalCategories(workspaceId);
  return buildCategoriesByName(workspaceId);
}

interface ApplyCategoriesInput {
  workspaceId: string;
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>;
  rules: Awaited<ReturnType<typeof prisma.categoryRule.findMany>>;
  memories: Awaited<ReturnType<typeof prisma.merchantCategoryMemory.findMany>>;
  byName: Map<string, string>;
}

async function applyResolvedCategories(input: ApplyCategoriesInput): Promise<number> {
  let updated = 0;
  for (const tx of input.transactions) {
    if (tx.mbankReviewResolvedAt) {
      continue;
    }
    const categoryId = resolveCategoryId(tx, input.rules, input.memories, input.byName);
    if (categoryId && categoryId !== tx.categoryId) {
      const result = await prisma.transaction.updateMany({
        where: {
          id: tx.id,
          workspaceId: input.workspaceId,
          mbankReviewResolvedAt: null,
        },
        data: { categoryId, mbankReviewResolvedAt: null },
      });
      updated += result.count;
    }
  }
  return updated;
}

export async function assignMbankCategoriesForWorkspace(
  workspaceId: string,
): Promise<number> {
  const [rules, memories, transactions] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId } }),
    prisma.transaction.findMany({ where: { workspaceId } }),
  ]);

  await syncMbankCategories(workspaceId);
  const byName = await buildCategoriesByName(workspaceId);
  const updated = await applyResolvedCategories({
    workspaceId,
    transactions,
    rules,
    memories,
    byName,
  });
  await deleteEmptyOrphanCategories(workspaceId);
  return updated;
}
