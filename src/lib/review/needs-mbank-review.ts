import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";
import { mapMbankCategoryToAppName } from "@/lib/mbank-category-map";

export interface MbankReviewInput {
  mbankCategory: string;
  categoryId: string | null;
  categoryName: string | null;
}

export function needsMbankReview(input: MbankReviewInput): boolean {
  const normalizedMbank = normalizeMbankCategoryName(input.mbankCategory);

  if (!normalizedMbank) {
    return Boolean(input.mbankCategory.trim()) || input.categoryId !== null;
  }

  if (!input.categoryId) {
    return true;
  }

  if (!input.categoryName) {
    return true;
  }

  const expectedAppName = mapMbankCategoryToAppName(normalizedMbank);
  return (
    input.categoryName.trim().toLowerCase() !== expectedAppName?.trim().toLowerCase()
  );
}
