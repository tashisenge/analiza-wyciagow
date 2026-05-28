import { describe, expect, it } from "vitest";

import { hasBulkSelection } from "@/lib/transactions/has-bulk-selection";

describe("hasBulkSelection", () => {
  it("treats visible list filters as a bulk selection scope", () => {
    expect(hasBulkSelection(undefined, { categoryId: "cat-food" })).toBe(true);
    expect(hasBulkSelection(undefined, { tagId: "tag-kids" })).toBe(true);
    expect(hasBulkSelection(undefined, { discretionary: true })).toBe(true);
  });
});
