import { DEFAULT_CATEGORIES } from "@/lib/categories/default-categories";

export { DEFAULT_CATEGORIES } from "@/lib/categories/default-categories";

export async function seedCategoriesForWorkspace(
  workspaceId: string,
  createCategory: (data: {
    workspaceId: string;
    name: string;
    color: string;
    isDefault: boolean;
    excludeFromOptimization: boolean;
  }) => Promise<unknown>,
): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await createCategory({
      workspaceId,
      name: category.name,
      color: category.color,
      isDefault: true,
      excludeFromOptimization: category.excludeFromOptimization,
    });
  }
}
