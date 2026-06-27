import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const updateMany = vi.fn();
const resolveReviewCategoryId = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

vi.mock("@/lib/review/resolve-review-category", () => ({
  resolveReviewCategoryId: (...args: unknown[]) => resolveReviewCategoryId(...args),
}));

import { persistReviewDecision } from "@/lib/review/persist-review-decision";

describe("persistReviewDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-fuel",
      mbankReviewResolvedAt: null,
      category: { name: "Paliwo" },
    });
    resolveReviewCategoryId.mockResolvedValue({ ok: true, categoryId: "cat-transport" });
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("guards updates to unresolved review rows", async () => {
    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "mbank",
    });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "tx-1",
        workspaceId: "ws-1",
        mbankReviewResolvedAt: null,
      },
      data: {
        categoryId: "cat-transport",
        mbankReviewResolvedAt: expect.any(Date) as Date,
      },
    });
  });

  it("rejects stale decisions when the guarded update matches nothing", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "mbank",
    });

    expect(result).toEqual({
      ok: false,
      error: "Transakcja została już rozstrzygnięta",
    });
  });

  it("rejects transactions that no longer need review", async () => {
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-transport",
      mbankReviewResolvedAt: new Date("2026-01-01T00:00:00.000Z"),
      category: { name: "Transport" },
    });

    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "app",
    });

    expect(result).toEqual({
      ok: false,
      error: "Transakcja nie wymaga już weryfikacji",
    });
    expect(resolveReviewCategoryId).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
