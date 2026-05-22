import { resolveCategoryId } from "@/lib/categorization/resolve-category";
import { prisma } from "@/lib/db";
import { colorForMbankCategory } from "@/lib/mbank/category-colors";
import { uniqueMbankCategoryNames } from "@/lib/mbank/category-names";

export async function buildCategoriesByName(
  workspaceId: string,
): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({ where: { workspaceId } });
  return new Map(categories.map((category) => [category.name, category.id]));
}

/** Tworzy brakujące Category o nazwach jak w mBanku. */
export async function syncMbankCategories(
  workspaceId: string,
  rawMbankNames: string[],
): Promise<Map<string, string>> {
  const names = uniqueMbankCategoryNames(rawMbankNames);
  const byName = await buildCategoriesByName(workspaceId);

  for (const name of names) {
    if (byName.has(name)) {
      continue;
    }
    const created = await prisma.category.create({
      data: {
        workspaceId,
        name,
        color: colorForMbankCategory(name),
        isDefault: true,
      },
    });
    byName.set(name, created.id);
  }

  return byName;
}

export async function assignMbankCategoriesForWorkspace(
  workspaceId: string,
): Promise<number> {
  const [rules, memories, transactions] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId } }),
    prisma.transaction.findMany({ where: { workspaceId } }),
  ]);

  await syncMbankCategories(
    workspaceId,
    transactions.map((tx) => tx.mbankCategory),
  );
  const byName = await buildCategoriesByName(workspaceId);
  let updated = 0;

  for (const tx of transactions) {
    const categoryId = resolveCategoryId(tx, rules, memories, byName);
    if (categoryId && categoryId !== tx.categoryId) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { categoryId },
      });
      updated += 1;
    }
  }

  return updated;
}
