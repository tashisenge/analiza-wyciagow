import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindMany = vi.fn();
const categoryRuleFindMany = vi.fn();
const merchantMemoryFindMany = vi.fn();
const transactionFindMany = vi.fn();
const transactionUpdateMany = vi.fn();
const transactionUpdate = vi.fn();
const categoryCreate = vi.fn();
const categoryDelete = vi.fn();
const transactionCount = vi.fn();
const categoryRuleCount = vi.fn();
const merchantMemoryCount = vi.fn();
const categoryBudgetCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      create: (...args: unknown[]) => categoryCreate(...args),
      delete: (...args: unknown[]) => categoryDelete(...args),
      findMany: (...args: unknown[]) => categoryFindMany(...args),
    },
    categoryRule: {
      count: (...args: unknown[]) => categoryRuleCount(...args),
      findMany: (...args: unknown[]) => categoryRuleFindMany(...args),
    },
    merchantCategoryMemory: {
      count: (...args: unknown[]) => merchantMemoryCount(...args),
      findMany: (...args: unknown[]) => merchantMemoryFindMany(...args),
    },
    transaction: {
      count: (...args: unknown[]) => transactionCount(...args),
      findMany: (...args: unknown[]) => transactionFindMany(...args),
      update: (...args: unknown[]) => transactionUpdate(...args),
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
    },
    categoryBudget: {
      count: (...args: unknown[]) => categoryBudgetCount(...args),
    },
  },
}));

import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";

describe("assignMbankCategoriesForWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue([
      {
        id: "cat-transport",
        name: "Transport",
        isDefault: true,
        excludeFromOptimization: false,
        isDiscretionary: false,
      },
    ]);
    categoryRuleFindMany.mockResolvedValue([]);
    merchantMemoryFindMany.mockResolvedValue([]);
    transactionFindMany.mockResolvedValue([]);
    transactionUpdateMany.mockResolvedValue({ count: 1 });
    transactionUpdate.mockResolvedValue({});
    categoryCreate.mockResolvedValue({});
    categoryDelete.mockResolvedValue({});
    transactionCount.mockResolvedValue(1);
    categoryRuleCount.mockResolvedValue(0);
    merchantMemoryCount.mockResolvedValue(0);
    categoryBudgetCount.mockResolvedValue(0);
  });

  it("does not overwrite transactions already resolved in the mBank review queue", async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: "tx-resolved",
        workspaceId: "ws-1",
        description: "Bus ticket",
        counterparty: "Transit",
        mbankCategory: "Transport",
        categoryId: "cat-manual",
        mbankReviewResolvedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "tx-open",
        workspaceId: "ws-1",
        description: "Bus ticket",
        counterparty: "Transit",
        mbankCategory: "Transport",
        categoryId: null,
        mbankReviewResolvedAt: null,
      },
    ]);

    const updated = await assignMbankCategoriesForWorkspace("ws-1");

    expect(updated).toBe(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionUpdateMany).toHaveBeenCalledTimes(1);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: "tx-open", workspaceId: "ws-1", mbankReviewResolvedAt: null },
      data: { categoryId: "cat-transport" },
    });
  });
});
