import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindMany = vi.fn();
const transactionCount = vi.fn();
const categoryDelete = vi.fn();
const categoryRuleCount = vi.fn();
const merchantMemoryCount = vi.fn();
const categoryBudgetCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => categoryFindMany(...args),
      delete: (...args: unknown[]) => categoryDelete(...args),
    },
    transaction: {
      count: (...args: unknown[]) => transactionCount(...args),
    },
    categoryRule: {
      count: (...args: unknown[]) => categoryRuleCount(...args),
    },
    merchantCategoryMemory: {
      count: (...args: unknown[]) => merchantMemoryCount(...args),
    },
    categoryBudget: {
      count: (...args: unknown[]) => categoryBudgetCount(...args),
    },
  },
}));

import { deleteEmptyOrphanCategories } from "@/lib/categories/ensure-canonical-categories";

describe("deleteEmptyOrphanCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionCount.mockResolvedValue(0);
    categoryRuleCount.mockResolvedValue(0);
    merchantMemoryCount.mockResolvedValue(0);
    categoryBudgetCount.mockResolvedValue(0);
    categoryDelete.mockResolvedValue({});
  });

  it("deletes empty auto-created non-canonical categories", async () => {
    categoryFindMany.mockResolvedValue([
      { id: "orphan-1", name: "mBank Foo", isDefault: true },
    ]);

    const deleted = await deleteEmptyOrphanCategories("ws-1");

    expect(deleted).toBe(1);
    expect(categoryDelete).toHaveBeenCalledWith({ where: { id: "orphan-1" } });
  });

  it("keeps empty user-created categories", async () => {
    categoryFindMany.mockResolvedValue([
      { id: "user-1", name: "My custom category", isDefault: false },
    ]);

    const deleted = await deleteEmptyOrphanCategories("ws-1");

    expect(deleted).toBe(0);
    expect(transactionCount).not.toHaveBeenCalled();
    expect(categoryDelete).not.toHaveBeenCalled();
  });

  it("keeps canonical categories even when empty", async () => {
    categoryFindMany.mockResolvedValue([
      { id: "canonical-1", name: "Żywność", isDefault: true },
    ]);

    const deleted = await deleteEmptyOrphanCategories("ws-1");

    expect(deleted).toBe(0);
    expect(transactionCount).not.toHaveBeenCalled();
    expect(categoryDelete).not.toHaveBeenCalled();
  });

  it("keeps empty legacy categories that still have related configuration", async () => {
    categoryFindMany.mockResolvedValue([
      { id: "legacy-1", name: "Legacy mBank", isDefault: true },
    ]);
    categoryRuleCount.mockResolvedValue(1);

    const deleted = await deleteEmptyOrphanCategories("ws-1");

    expect(deleted).toBe(0);
    expect(categoryRuleCount).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", categoryId: "legacy-1" },
    });
    expect(categoryDelete).not.toHaveBeenCalled();
  });
});
