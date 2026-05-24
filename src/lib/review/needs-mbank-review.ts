import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

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

  return input.categoryName.trim().toLowerCase() !== normalizedMbank.trim().toLowerCase();
}
