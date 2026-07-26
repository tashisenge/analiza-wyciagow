import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindFirst = vi.fn();
const categoryBudgetUpsert = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findFirst: (...args: unknown[]) => categoryFindFirst(...args),
    },
    categoryBudget: {
      upsert: (...args: unknown[]) => categoryBudgetUpsert(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-mine" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

import { upsertCategoryBudget } from "@/server/actions/optimization";

describe("upsertCategoryBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryBudgetUpsert.mockResolvedValue({ id: "budget-1" });
  });

  it("rejects category from another workspace", async () => {
    categoryFindFirst.mockResolvedValue(null);

    const result = await upsertCategoryBudget("cat-foreign", "dom", 500);

    expect(result).toEqual({ ok: false, error: "Nieprawidłowa kategoria" });
    expect(categoryFindFirst).toHaveBeenCalledWith({
      where: { id: "cat-foreign", workspaceId: "ws-mine" },
      select: { id: true },
    });
    expect(categoryBudgetUpsert).not.toHaveBeenCalled();
  });

  it("upserts budget for category in current workspace", async () => {
    categoryFindFirst.mockResolvedValue({ id: "cat-mine" });

    const result = await upsertCategoryBudget("cat-mine", "dom", 500);

    expect(result).toEqual({ ok: true, message: "Budżet zapisany." });
    expect(categoryBudgetUpsert).toHaveBeenCalledWith({
      where: {
        workspaceId_categoryId_accountContext: {
          workspaceId: "ws-mine",
          categoryId: "cat-mine",
          accountContext: "dom",
        },
      },
      create: {
        workspaceId: "ws-mine",
        categoryId: "cat-mine",
        accountContext: "dom",
        monthlyLimit: 500,
      },
      update: { monthlyLimit: 500 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/optimize");
  });

  it("rejects invalid budget payload before lookup", async () => {
    const result = await upsertCategoryBudget("cat-mine", "dom", -10);

    expect(result).toEqual({ ok: false, error: "Nieprawidłowe dane budżetu" });
    expect(categoryFindFirst).not.toHaveBeenCalled();
    expect(categoryBudgetUpsert).not.toHaveBeenCalled();
  });
});
