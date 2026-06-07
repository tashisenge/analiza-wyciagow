import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryCreate = vi.fn();
const categoryFindMany = vi.fn();
const categoryUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      create: (...args: unknown[]) => categoryCreate(...args),
      findMany: (...args: unknown[]) => categoryFindMany(...args),
      update: (...args: unknown[]) => categoryUpdate(...args),
    },
  },
}));

import { DEFAULT_CATEGORIES } from "@/lib/categories/default-categories";
import { ensureCanonicalCategories } from "@/lib/categories/ensure-canonical-categories";

describe("ensureCanonicalCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryCreate.mockResolvedValue({});
    categoryUpdate.mockResolvedValue({});
  });

  it("creates missing canonical categories with default flags", async () => {
    categoryFindMany.mockResolvedValue([]);

    await ensureCanonicalCategories("ws-1");

    expect(categoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "ws-1",
        name: DEFAULT_CATEGORIES[0]?.name,
        excludeFromOptimization: DEFAULT_CATEGORIES[0]?.excludeFromOptimization,
        isDiscretionary: DEFAULT_CATEGORIES[0]?.isDiscretionary,
      }),
    });
  });

  it("preserves user-edited flags on existing canonical categories", async () => {
    const entertainment = DEFAULT_CATEGORIES.find(
      (category) => category.name === "Rozrywka",
    );
    expect(entertainment).toBeDefined();
    categoryFindMany.mockResolvedValue(
      DEFAULT_CATEGORIES.map((category) => ({
        id: `cat-${category.name}`,
        name: category.name,
        isDefault: true,
        excludeFromOptimization:
          category.name === "Rozrywka"
            ? !category.excludeFromOptimization
            : category.excludeFromOptimization,
        isDiscretionary:
          category.name === "Rozrywka"
            ? !category.isDiscretionary
            : category.isDiscretionary,
      })),
    );

    await ensureCanonicalCategories("ws-1");

    expect(categoryCreate).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });
});
