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
  });

  it("does not overwrite user-editable flags on existing canonical categories", async () => {
    categoryFindMany.mockResolvedValue(
      DEFAULT_CATEGORIES.map((def, index) => ({
        id: `cat-${String(index)}`,
        workspaceId: "ws-1",
        name: def.name,
        color: def.color,
        isDefault: true,
        excludeFromOptimization: !def.excludeFromOptimization,
        isDiscretionary: !def.isDiscretionary,
      })),
    );

    await ensureCanonicalCategories("ws-1");

    expect(categoryCreate).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it("creates missing canonical categories with their default flags", async () => {
    categoryFindMany.mockResolvedValue([]);

    await ensureCanonicalCategories("ws-1");

    expect(categoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "ws-1",
          name: "Rozrywka",
          excludeFromOptimization: false,
          isDiscretionary: true,
        }),
      }),
    );
  });
});
