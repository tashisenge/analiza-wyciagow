import { describe, expect, it } from "vitest";

import { buildTransactionsWhere } from "@/lib/transactions/build-transactions-where";

describe("buildTransactionsWhere", () => {
  it("scopes to workspace and account ids", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a", "acc-b"], {});
    expect(where).toEqual({
      workspaceId: "ws-1",
      accountId: { in: ["acc-a", "acc-b"] },
    });
  });

  it("filters by category id", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a"], { categoryId: "cat-1" });
    expect(where.categoryId).toBe("cat-1");
  });

  it("ignores empty category id", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a"], { categoryId: "" });
    expect(where.categoryId).toBeUndefined();
  });

  it("uncategorized wins over category id in URL", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a"], {
      uncategorized: "1",
      categoryId: "cat-1",
    });
    expect(where.categoryId).toBeNull();
  });

  it("combines discretionary with category id", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a"], {
      discretionary: "1",
      categoryId: "cat-1",
    });
    expect(where.categoryId).toBe("cat-1");
    expect(where.category).toEqual({ isDiscretionary: true });
  });

  it("filters by tag id", () => {
    const where = buildTransactionsWhere("ws-1", ["acc-a"], { tagId: "tag-1" });
    expect(where.tags).toEqual({ some: { tagId: "tag-1" } });
  });
});
