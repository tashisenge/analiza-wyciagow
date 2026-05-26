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
});
