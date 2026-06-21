import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindMany = vi.fn();
const categoryRuleFindMany = vi.fn();
const merchantMemoryFindMany = vi.fn();
const transactionFindMany = vi.fn();
const transactionUpdateMany = vi.fn();

vi.mock("@/lib/categories/ensure-canonical-categories", () => ({
  deleteEmptyOrphanCategories: vi.fn().mockResolvedValue(0),
  ensureCanonicalCategories: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => categoryFindMany(...args),
    },
    categoryRule: {
      findMany: (...args: unknown[]) => categoryRuleFindMany(...args),
    },
    merchantCategoryMemory: {
      findMany: (...args: unknown[]) => merchantMemoryFindMany(...args),
    },
    transaction: {
      findMany: (...args: unknown[]) => transactionFindMany(...args),
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
    },
  },
}));

import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";

describe("assignMbankCategoriesForWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue([{ id: "cat-food", name: "Food" }]);
    categoryRuleFindMany.mockResolvedValue([]);
    merchantMemoryFindMany.mockResolvedValue([
      { counterparty: "Shop", categoryId: "cat-food" },
    ]);
    transactionFindMany.mockResolvedValue([
      {
        id: "resolved",
        description: "",
        counterparty: "Shop",
        mbankCategory: "Transport",
        categoryId: "cat-old",
        mbankReviewResolvedAt: new Date("2026-01-01"),
      },
      {
        id: "open",
        description: "",
        counterparty: "Shop",
        mbankCategory: "Transport",
        categoryId: "cat-old",
        mbankReviewResolvedAt: null,
      },
    ]);
    transactionUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("does not overwrite resolved review decisions while remapping categories", async () => {
    const updated = await assignMbankCategoriesForWorkspace("ws-1");

    expect(updated).toBe(1);
    expect(transactionUpdateMany).toHaveBeenCalledTimes(1);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: "open", workspaceId: "ws-1", mbankReviewResolvedAt: null },
      data: { categoryId: "cat-food", mbankReviewResolvedAt: null },
    });
  });
});
