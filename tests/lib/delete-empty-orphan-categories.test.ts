import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindMany = vi.fn();
const categoryCreate = vi.fn();
const categoryUpdate = vi.fn();
const transactionCount = vi.fn();
const categoryDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: (...args: unknown[]) => categoryFindMany(...args),
      create: (...args: unknown[]) => categoryCreate(...args),
      update: (...args: unknown[]) => categoryUpdate(...args),
      delete: (...args: unknown[]) => categoryDelete(...args),
    },
    transaction: {
      count: (...args: unknown[]) => transactionCount(...args),
    },
  },
}));

import { DEFAULT_CATEGORIES } from "@/lib/categories/default-categories";
import {
  deleteEmptyOrphanCategories,
  ensureCanonicalCategories,
} from "@/lib/categories/ensure-canonical-categories";

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

describe("ensureCanonicalCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryCreate.mockResolvedValue({});
    categoryUpdate.mockResolvedValue({});
  });

  it("does not overwrite user-edited canonical category flags", async () => {
    categoryFindMany.mockResolvedValue(
      canonicalCategoryRows().map((category) =>
        category.name === "Rozrywka"
          ? { ...category, excludeFromOptimization: true, isDiscretionary: false }
          : category,
      ),
    );

    await ensureCanonicalCategories("ws-1");

    expect(categoryCreate).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteEmptyOrphanCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionCount.mockResolvedValue(0);
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
});
