import { describe, expect, it } from "vitest";

import { resolveCategoryIdFromCategoryForm } from "@/lib/transactions/resolve-category-id-from-form";

describe("resolveCategoryIdFromCategoryForm", () => {
  it("clears category when Usuń kategorię submit flag is present", () => {
    const formData = new FormData();
    formData.append("transactionId", "tx-1");
    // Browser document order: select value is submitted before the clear control.
    formData.append("categoryId", "cat-food");
    formData.append("clearCategory", "1");

    expect(resolveCategoryIdFromCategoryForm(formData)).toBe("");
  });

  it("keeps selected category for normal assign submits", () => {
    const formData = new FormData();
    formData.append("categoryId", "cat-food");

    expect(resolveCategoryIdFromCategoryForm(formData)).toBe("cat-food");
  });

  it("treats empty select value as clear", () => {
    const formData = new FormData();
    formData.append("categoryId", "");

    expect(resolveCategoryIdFromCategoryForm(formData)).toBe("");
  });
});
