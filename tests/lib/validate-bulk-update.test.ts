import { describe, expect, it } from "vitest";

import { bulkUpdateSchema } from "@/lib/transactions/validate-bulk-update";

describe("bulkUpdateSchema", () => {
  it("preserves list-derived filters used to scope bulk mutations", () => {
    const parsed = bulkUpdateSchema.parse({
      categoryId: "target-cat",
      filters: {
        categoryId: "source-cat",
        categoryName: "Jedzenie",
        tagId: "tag-kids",
        discretionary: true,
      },
    });

    expect(parsed.filters).toMatchObject({
      categoryId: "source-cat",
      categoryName: "Jedzenie",
      tagId: "tag-kids",
      discretionary: true,
    });
  });
});
