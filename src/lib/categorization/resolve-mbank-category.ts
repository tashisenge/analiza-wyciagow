import {
  normalizeMbankCategoryName,
  resolveCategoryIdByName,
} from "@/lib/mbank-category-map";

export function resolveMbankCategoryId(
  mbankCategory: string | undefined,
  categoriesByName: Map<string, string>,
): string | null {
  if (!mbankCategory) {
    return null;
  }
  const name = normalizeMbankCategoryName(mbankCategory);
  if (!name) {
    return null;
  }
  return resolveCategoryIdByName(name, categoriesByName);
}
