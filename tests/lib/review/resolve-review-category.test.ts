import { beforeEach, describe, expect, it, vi } from "vitest";

interface CategoryFindFirstArgs {
  where: {
    workspaceId: string;
    name: string;
  };
}

const categoryFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findFirst: (...args: unknown[]) => categoryFindFirst(...args),
    },
  },
}));

import { resolveReviewCategoryId } from "@/lib/review/resolve-review-category";

describe("resolveReviewCategoryId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts mapped canonical app category for mbank decisions", async () => {
    categoryFindFirst.mockImplementation(({ where }: CategoryFindFirstArgs) =>
      Promise.resolve(
        where.workspaceId === "ws-1" && where.name === "Rozrywka"
          ? { id: "cat-entertainment" }
          : null,
      ),
    );

    await expect(
      resolveReviewCategoryId({
        workspaceId: "ws-1",
        tx: { mbankCategory: "Restauracje", categoryId: null },
        decision: "mbank",
      }),
    ).resolves.toEqual({ ok: true, categoryId: "cat-entertainment" });

    expect(categoryFindFirst).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", name: "Rozrywka" },
    });
  });
});
