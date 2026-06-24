import { describe, expect, it, vi } from "vitest";

import { applyBulkCategoryUpdate } from "@/lib/transactions/apply-bulk-category";

describe("applyBulkCategoryUpdate", () => {
  it("updates transactions and remembers unique counterparties", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([
          { id: "t1", counterparty: "LIDL" },
          { id: "t2", counterparty: "LIDL" },
        ]),
        updateMany,
      },
      merchantCategoryMemory: { upsert },
    };

    const result = await applyBulkCategoryUpdate({
      prisma: prisma as never,
      workspaceId: "ws-1",
      transactionIds: ["t1", "t2"],
      categoryId: "cat-1",
      rememberMerchant: true,
    });

    expect(result.updatedCount).toBe(2);
    expect(result.rememberedMerchants).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", id: { in: ["t1", "t2"] } },
      data: { categoryId: "cat-1", mbankReviewResolvedAt: null },
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("clears category when categoryId is null", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      transaction: {
        findMany: vi.fn().mockResolvedValue([{ id: "t1", counterparty: "" }]),
        updateMany,
      },
      merchantCategoryMemory: { upsert: vi.fn() },
    };

    const result = await applyBulkCategoryUpdate({
      prisma: prisma as never,
      workspaceId: "ws-1",
      transactionIds: ["t1"],
      categoryId: null,
      rememberMerchant: false,
    });

    expect(result.updatedCount).toBe(1);
    expect(result.rememberedMerchants).toBe(0);
    expect(updateMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", id: { in: ["t1"] } },
      data: { categoryId: null, mbankReviewResolvedAt: null },
    });
  });
});
