import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionFindFirst = vi.fn();
const transactionUpdateMany = vi.fn();
const categoryFindFirst = vi.fn();
const findSimilarTransactionIds = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findFirst: (...args: unknown[]) => transactionFindFirst(...args),
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
    },
    category: {
      findFirst: (...args: unknown[]) => categoryFindFirst(...args),
    },
    merchantCategoryMemory: { upsert: vi.fn() },
    categoryRule: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-mine" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/transactions/find-similar-transaction-ids", () => ({
  findSimilarTransactionIds: (...args: unknown[]) => findSimilarTransactionIds(...args),
}));

import { updateTransactionCategory } from "@/server/actions/transactions";

describe("updateTransactionCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects unknown transaction", async () => {
    transactionFindFirst.mockResolvedValue(null);

    const result = await updateTransactionCategory("tx-1", "cat-1");

    expect(result).toEqual({ ok: false, error: "Nieznaleziono transakcji" });
    expect(transactionUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects invalid category", async () => {
    transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      counterparty: "LIDL",
      amount: { toString: () => "10.00" },
      currency: "PLN",
    });
    categoryFindFirst.mockResolvedValue(null);

    const result = await updateTransactionCategory("tx-1", "cat-bad");

    expect(result).toEqual({ ok: false, error: "Nieprawidłowa kategoria" });
    expect(transactionUpdateMany).not.toHaveBeenCalled();
  });

  it("updates transaction category", async () => {
    transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      counterparty: "LIDL",
      amount: { toString: () => "10.00" },
      currency: "PLN",
    });
    categoryFindFirst.mockResolvedValue({ id: "cat-1" });

    const result = await updateTransactionCategory("tx-1", "cat-1");

    expect(result).toEqual({ ok: true, updatedCount: 1 });
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-mine", id: { in: ["tx-1"] } },
      data: { categoryId: "cat-1" },
    });
  });

  it("limits similar updates to transactions visible on the current page", async () => {
    transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      counterparty: "LIDL",
      amount: { toString: () => "10.00" },
      currency: "PLN",
    });
    categoryFindFirst.mockResolvedValue({ id: "cat-1" });

    await updateTransactionCategory("tx-1", "cat-1", {
      applyToSimilar: true,
      candidateTransactionIds: ["tx-1", "tx-visible"],
    });

    expect(findSimilarTransactionIds).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-mine",
        excludeTransactionId: "tx-1",
        candidateTransactionIds: ["tx-1", "tx-visible"],
      }),
    );
  });
});
