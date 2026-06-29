import { describe, expect, it } from "vitest";

import { hasBulkSelection } from "@/lib/transactions/has-bulk-selection";

describe("hasBulkSelection", () => {
  it("treats hidden transaction list filters as a bulk scope", () => {
    expect(hasBulkSelection(undefined, { discretionaryOnly: true })).toBe(true);
    expect(hasBulkSelection(undefined, { categoryId: "cat-1" })).toBe(true);
    expect(hasBulkSelection(undefined, { tagId: "tag-1" })).toBe(true);
  });
});
