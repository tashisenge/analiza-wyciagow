import {
  DEFAULT_CATEGORIES,
  isCanonicalCategoryName,
  type DefaultCategoryDef,
} from "@/lib/categories/default-categories";
import { prisma } from "@/lib/db";

async function createCanonicalCategory(
  workspaceId: string,
  def: DefaultCategoryDef,
): Promise<void> {
  await prisma.category.create({
    data: {
      workspaceId,
      name: def.name,
      color: def.color,
      isDefault: true,
      excludeFromOptimization: def.excludeFromOptimization,
      isDiscretionary: def.isDiscretionary,
    },
  });
}

/** Tworzy brakujące kanoniczne kategorie, zachowując istniejące ustawienia użytkownika. */
export async function ensureCanonicalCategories(workspaceId: string): Promise<void> {
  const existing = await prisma.category.findMany({ where: { workspaceId } });
  const byName = new Map(existing.map((c) => [c.name, c]));

  for (const def of DEFAULT_CATEGORIES) {
    const found = byName.get(def.name);
    if (!found) {
      await createCanonicalCategory(workspaceId, def);
    }
  }
}

async function hasRelatedCategoryConfig(
  workspaceId: string,
  categoryId: string,
): Promise<boolean> {
  const [ruleCount, memoryCount, budgetCount] = await Promise.all([
    prisma.categoryRule.count({ where: { workspaceId, categoryId } }),
    prisma.merchantCategoryMemory.count({ where: { workspaceId, categoryId } }),
    prisma.categoryBudget.count({ where: { workspaceId, categoryId } }),
  ]);
  return ruleCount > 0 || memoryCount > 0 || budgetCount > 0;
}

export async function deleteEmptyOrphanCategories(workspaceId: string): Promise<number> {
  const categories = await prisma.category.findMany({ where: { workspaceId } });
  let deleted = 0;

  for (const category of categories) {
    if (isCanonicalCategoryName(category.name) || !category.isDefault) {
      continue;
    }
    const count = await prisma.transaction.count({
      where: { workspaceId, categoryId: category.id },
    });
    if (count > 0) {
      continue;
    }
    if (await hasRelatedCategoryConfig(workspaceId, category.id)) {
      continue;
    }
    await prisma.category.delete({ where: { id: category.id } });
    deleted += 1;
  }

  return deleted;
}
