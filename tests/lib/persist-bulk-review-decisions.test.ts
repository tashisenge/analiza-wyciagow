import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const updateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
    category: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/review/resolve-review-category", () => ({
  resolveReviewCategoryId: vi.fn().mockResolvedValue({ ok: true, categoryId: "cat-1" }),
}));

import { persistBulkReviewDecisions } from "@/lib/review/persist-bulk-review-decisions";

describe("persistBulkReviewDecisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-old",
      mbankReviewResolvedAt: null,
      category: { name: "Fuel" },
    });
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects empty selection", async () => {
    const result = await persistBulkReviewDecisions({
      workspaceId: "ws-1",
      transactionIds: [],
      decision: "mbank",
      categoryIdByName: new Map(),
    });
    expect(result).toEqual({ ok: false, error: "Brak zaznaczonych transakcji" });
  });

  it("updates selected transactions", async () => {
    const result = await persistBulkReviewDecisions({
      workspaceId: "ws-1",
      transactionIds: ["tx-1", "tx-2"],
      decision: "mbank",
      categoryIdByName: new Map(),
    });

    expect(result).toMatchObject({ ok: true, updatedCount: 2, failedCount: 0 });
    expect(updateMany).toHaveBeenCalledTimes(2);
  });

  it("does not overwrite transactions already resolved by another review action", async () => {
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-old",
      mbankReviewResolvedAt: new Date("2026-01-01"),
      category: { name: "Fuel" },
    });

    const result = await persistBulkReviewDecisions({
      workspaceId: "ws-1",
      transactionIds: ["tx-1"],
      decision: "mbank",
      categoryIdByName: new Map(),
    });

    expect(result).toMatchObject({ ok: true, updatedCount: 0, failedCount: 1 });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("reports failure when a concurrent review action wins the update race", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await persistBulkReviewDecisions({
      workspaceId: "ws-1",
      transactionIds: ["tx-1"],
      decision: "mbank",
      categoryIdByName: new Map(),
    });

    expect(result).toMatchObject({ ok: true, updatedCount: 0, failedCount: 1 });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mbankReviewResolvedAt: null }),
      }),
    );
  });
});
