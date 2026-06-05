import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindMany = vi.fn();
const categoryCreate = vi.fn();
const categoryUpdate = vi.fn();
const categoryDelete = vi.fn();
const transactionFindMany = vi.fn();
const transactionUpdateMany = vi.fn();
const transactionCount = vi.fn();
const categoryRuleFindMany = vi.fn();
const merchantMemoryFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => categoryFindMany(...args),
      create: (...args: unknown[]) => categoryCreate(...args),
      update: (...args: unknown[]) => categoryUpdate(...args),
      delete: (...args: unknown[]) => categoryDelete(...args),
    },
    transaction: {
      findMany: (...args: unknown[]) => transactionFindMany(...args),
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
      count: (...args: unknown[]) => transactionCount(...args),
    },
    categoryRule: {
      findMany: (...args: unknown[]) => categoryRuleFindMany(...args),
    },
    merchantCategoryMemory: {
      findMany: (...args: unknown[]) => merchantMemoryFindMany(...args),
    },
  },
}));

import { DEFAULT_CATEGORIES } from "@/lib/categories/default-categories";
import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";

function canonicalCategoryRows() {
  return DEFAULT_CATEGORIES.map((category) => ({
    id: `cat-${category.name}`,
    workspaceId: "ws-1",
    name: category.name,
    color: category.color,
    isDefault: true,
    excludeFromOptimization: category.excludeFromOptimization,
    isDiscretionary: category.isDiscretionary,
  }));
}

describe("assignMbankCategoriesForWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue(canonicalCategoryRows());
    categoryCreate.mockResolvedValue({});
    categoryUpdate.mockResolvedValue({});
    categoryDelete.mockResolvedValue({});
    transactionUpdateMany.mockResolvedValue({ count: 1 });
    transactionCount.mockResolvedValue(0);
    categoryRuleFindMany.mockResolvedValue([]);
    merchantMemoryFindMany.mockResolvedValue([]);
  });

  it("does not overwrite review-resolved category decisions during mBank sync", async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: "tx-reviewed",
        workspaceId: "ws-1",
        description: "Kurs języka",
        counterparty: "Szkoła",
        mbankCategory: "Edukacja",
        categoryId: "cat-Rozrywka",
        mbankReviewResolvedAt: new Date("2026-05-01T00:00:00Z"),
      },
      {
        id: "tx-unreviewed",
        workspaceId: "ws-1",
        description: "Kurs języka",
        counterparty: "Szkoła",
        mbankCategory: "Edukacja",
        categoryId: "cat-Rozrywka",
        mbankReviewResolvedAt: null,
      },
    ]);

    const updated = await assignMbankCategoriesForWorkspace("ws-1");

    expect(updated).toBe(1);
    expect(transactionUpdateMany).toHaveBeenCalledTimes(1);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "tx-unreviewed",
        workspaceId: "ws-1",
        mbankReviewResolvedAt: null,
      },
      data: { categoryId: "cat-Inne" },
    });
  });

  it("does not count stale snapshot updates when a transaction was reviewed concurrently", async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: "tx-race",
        workspaceId: "ws-1",
        description: "Kurs języka",
        counterparty: "Szkoła",
        mbankCategory: "Edukacja",
        categoryId: "cat-Rozrywka",
        mbankReviewResolvedAt: null,
      },
    ]);
    transactionUpdateMany.mockResolvedValue({ count: 0 });

    const updated = await assignMbankCategoriesForWorkspace("ws-1");

    expect(updated).toBe(0);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "tx-race",
        workspaceId: "ws-1",
        mbankReviewResolvedAt: null,
      },
      data: { categoryId: "cat-Inne" },
    });
  });
});
