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
        name: "Rozrywka",
        isDefault: true,
        excludeFromOptimization: false,
        isDiscretionary: true,
      }),
    });
  });

  it("does not overwrite user flags on existing canonical categories", async () => {
    categoryFindMany.mockResolvedValue([
      {
        id: "cat-entertainment",
        workspaceId: "ws-1",
        name: "Rozrywka",
        color: "#f97316",
        isDefault: true,
        excludeFromOptimization: true,
        isDiscretionary: false,
      },
    ]);

    await ensureCanonicalCategories("ws-1");

    expect(categoryUpdate).not.toHaveBeenCalled();
  });
});
