import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
const categoryRuleDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const merchantMemoryDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const optimizationOpportunityUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
const categoryBudgetDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const categoryDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
const categoryFindFirst = vi.fn();
const transactionClient = {
  transaction: { updateMany: transactionUpdateMany },
  categoryRule: { deleteMany: categoryRuleDeleteMany },
  merchantCategoryMemory: { deleteMany: merchantMemoryDeleteMany },
  optimizationOpportunity: { updateMany: optimizationOpportunityUpdateMany },
  categoryBudget: { deleteMany: categoryBudgetDeleteMany },
  category: { deleteMany: categoryDeleteMany },
};
const prismaTransaction = vi.fn((callback: (tx: typeof transactionClient) => unknown) =>
  callback(transactionClient),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (tx: typeof transactionClient) => unknown) =>
      prismaTransaction(callback),
    category: {
      findFirst: (...args: unknown[]) => categoryFindFirst(...args),
      deleteMany: (...args: unknown[]) => categoryDeleteMany(...args),
    },
    transaction: {
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
    },
    categoryRule: {
      deleteMany: (...args: unknown[]) => categoryRuleDeleteMany(...args),
    },
    merchantCategoryMemory: {
      deleteMany: (...args: unknown[]) => merchantMemoryDeleteMany(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-mine" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { deleteCategory } from "@/server/actions/categories";

describe("deleteCategory IDOR protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("rejects category from another workspace without mutating data", async () => {
    categoryFindFirst.mockResolvedValue(null);

    const result = await deleteCategory("cat-other-workspace");

    expect(result).toEqual({ ok: false, error: "Nie znaleziono kategorii" });
    expect(transactionUpdateMany).not.toHaveBeenCalled();
    expect(categoryRuleDeleteMany).not.toHaveBeenCalled();
    expect(merchantMemoryDeleteMany).not.toHaveBeenCalled();
    expect(categoryDeleteMany).not.toHaveBeenCalled();
    expect(categoryFindFirst).toHaveBeenCalledWith({
      where: { id: "cat-other-workspace", workspaceId: "ws-mine" },
    });
  });

  it("scopes transaction, rule and memory deletes to workspace", async () => {
    categoryFindFirst.mockResolvedValue({
      id: "cat-1",
      workspaceId: "ws-mine",
      isDefault: false,
    });

    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ ok: true });
    const expectedScope = { workspaceId: "ws-mine", categoryId: "cat-1" };
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: expectedScope,
      data: { categoryId: null },
    });
    expect(categoryRuleDeleteMany).toHaveBeenCalledWith({ where: expectedScope });
    expect(merchantMemoryDeleteMany).toHaveBeenCalledWith({ where: expectedScope });
    expect(categoryDeleteMany).toHaveBeenCalledWith({
      where: { id: "cat-1", workspaceId: "ws-mine" },
    });
  });

  it("cleans every category dependency in one transaction", async () => {
    categoryFindFirst.mockResolvedValue({
      id: "cat-1",
      workspaceId: "ws-mine",
      isDefault: false,
    });

    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ ok: true });
    const expectedScope = { workspaceId: "ws-mine", categoryId: "cat-1" };
    expect(prismaTransaction).toHaveBeenCalledTimes(1);
    expect(optimizationOpportunityUpdateMany).toHaveBeenCalledWith({
      where: expectedScope,
      data: { categoryId: null },
    });
    expect(categoryBudgetDeleteMany).toHaveBeenCalledWith({ where: expectedScope });
    expect(categoryDeleteMany).toHaveBeenCalledWith({
      where: { id: "cat-1", workspaceId: "ws-mine" },
    });
  });
});
