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

  it("keeps list-only filters when building bulk targets", () => {
    const where = buildBulkCategoryWhere({
      workspaceId: "ws-1",
      accountIds: ["acc-a"],
      filters: {
        counterpartyContains: "netflix",
        discretionaryOnly: true,
        tagId: "tag-1",
        categoryId: "cat-1",
      },
    });

    expect(where).toMatchObject({
      counterparty: { contains: "netflix", mode: "insensitive" },
      categoryId: "cat-1",
      category: { isDiscretionary: true },
      tags: { some: { tagId: "tag-1" } },
    });
  });
});
