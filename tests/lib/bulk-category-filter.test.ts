import { describe, expect, it } from "vitest";

import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";

describe("buildBulkCategoryWhere", () => {
  it("scopes to workspace and account ids", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a", "acc-b"],
      filters: {},
    });
    expect(where).toEqual({
      workspaceId: "ws-1",
      accountId: { in: ["acc-a", "acc-b"] },
    });
  });

  it("adds counterparty contains filter", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { counterpartyContains: "lidl" },
    });
    expect(where.counterparty).toEqual({
      contains: "lidl",
      mode: "insensitive",
    });
  });

  it("adds uncategorized filter", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { uncategorizedOnly: true },
    });
    expect(where.categoryId).toBeNull();
  });

  it("adds date range on bookedAt", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
    });
    expect(where.bookedAt).toEqual({
      gte: new Date("2026-01-01T00:00:00.000Z"),
      lte: new Date("2026-01-31T23:59:59.999Z"),
    });
  });

  it("filters mbank category case-insensitive", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: { mbankCategory: "Żywność i chemia domowa" },
    });
    expect(where.mbankCategory).toEqual({
      equals: "Żywność i chemia domowa",
      mode: "insensitive",
    });
  });

  it("mirrors visible list filters that can otherwise broaden bulk writes", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: {
        categoryId: "cat-food",
        tagId: "tag-kids",
        discretionary: true,
      },
    });

    expect(where.categoryId).toBe("cat-food");
    expect(where.tags).toEqual({ some: { tagId: "tag-kids" } });
    expect(where.category).toEqual({ isDiscretionary: true });
  });
});
