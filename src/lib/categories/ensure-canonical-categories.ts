import {
  DEFAULT_CATEGORIES,
  isCanonicalCategoryName,
  type DefaultCategoryDef,
} from "@/lib/categories/default-categories";
import { prisma } from "@/lib/db";

type ExistingCategory = Awaited<ReturnType<typeof prisma.category.findMany>>[number];

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
    },
  });
}

async function syncExcludeFromOptimization(
  found: ExistingCategory,
  def: DefaultCategoryDef,
): Promise<void> {
  if (found.excludeFromOptimization === def.excludeFromOptimization) {
    return;
  }

  await prisma.category.update({
    where: { id: found.id },
    data: { excludeFromOptimization: def.excludeFromOptimization },
  });
}

/** Tworzy brakujące kanoniczne kategorie i ustawia flagi stałych wydatków. */
export async function ensureCanonicalCategories(workspaceId: string): Promise<void> {
  const existing = await prisma.category.findMany({ where: { workspaceId } });
  const byName = new Map(existing.map((c) => [c.name, c]));

  for (const def of DEFAULT_CATEGORIES) {
    const found = byName.get(def.name);
    if (!found) {
      await createCanonicalCategory(workspaceId, def);
      continue;
    }
    await syncExcludeFromOptimization(found, def);
  }
}

export async function deleteEmptyOrphanCategories(workspaceId: string): Promise<number> {
  const categories = await prisma.category.findMany({ where: { workspaceId } });
  let deleted = 0;

  for (const category of categories) {
    if (isCanonicalCategoryName(category.name)) {
      continue;
    }
    const count = await prisma.transaction.count({ where: { categoryId: category.id } });
    if (count === 0) {
      await prisma.category.delete({ where: { id: category.id } });
      deleted += 1;
    }
  }

  return deleted;
}
