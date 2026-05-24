import {
  mapMbankCategoryToAppName,
  resolveCategoryIdByName,
} from "@/lib/mbank-category-map";

export function resolveMbankCategoryId(
  mbankCategory: string | undefined,
  categoriesByName: Map<string, string>,
): string | null {
  if (!mbankCategory) {
    return null;
  }
  const appName = mapMbankCategoryToAppName(mbankCategory);
  if (!appName) {
    return null;
  }
  return resolveCategoryIdByName(appName, categoriesByName);
}
