import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export {
  normalizeMbankCategoryName,
  uniqueMbankCategoryNames,
} from "@/lib/mbank/category-names";

export function resolveCategoryIdByName(
  categoryName: string,
  categoriesByName: Map<string, string>,
): string | null {
  return categoriesByName.get(categoryName) ?? null;
}

/** @deprecated Używamy nazw mBank 1:1 — zobacz resolveCategoryId. */
export function mapMbankCategoryToAppName(mbankCategory: string): string | null {
  return normalizeMbankCategoryName(mbankCategory);
}
