import { isFixedExpenseCategoryName } from "@/lib/categories/fixed-expense";

export {
  CANONICAL_CATEGORY_NAMES,
  DEFAULT_CATEGORIES,
  excludeFromOptimizationForName,
  isCanonicalCategoryName,
} from "@/lib/categories/default-categories";

export function shouldExcludeCategoryFromOptimization(category: {
  name: string;
  excludeFromOptimization: boolean;
}): boolean {
  return category.excludeFromOptimization || isFixedExpenseCategoryName(category.name);
}
