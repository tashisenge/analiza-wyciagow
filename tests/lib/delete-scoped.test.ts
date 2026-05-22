import { describe, expect, it } from "vitest";

import {
  scopedCategoryId,
  scopedCategoryPrimaryKey,
} from "@/lib/categories/delete-scoped";

describe("scoped category delete filters", () => {
  it("includes workspaceId and categoryId", () => {
    expect(scopedCategoryId("ws-a", "cat-1")).toEqual({
      workspaceId: "ws-a",
      categoryId: "cat-1",
    });
  });

  it("scopes primary key delete by workspace", () => {
    expect(scopedCategoryPrimaryKey("ws-a", "cat-1")).toEqual({
      id: "cat-1",
      workspaceId: "ws-a",
    });
  });
});
