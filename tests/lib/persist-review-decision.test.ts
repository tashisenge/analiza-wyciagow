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
  resolveReviewCategoryId: vi.fn().mockResolvedValue({ ok: true, categoryId: "cat-new" }),
}));

import { persistReviewDecision } from "@/lib/review/persist-review-decision";

describe("persistReviewDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-old",
      mbankReviewResolvedAt: null,
      category: { name: "Paliwo" },
    });
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("updates an unresolved review row", async () => {
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
        categoryId: "cat-old",
        mbankCategory: "Transport",
      },
      data: {
        categoryId: "cat-new",
        mbankReviewResolvedAt: expect.any(Date) as Date,
      },
    });
  });

  it("does not overwrite a row that was already resolved", async () => {
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-old",
      mbankReviewResolvedAt: new Date("2026-06-01T00:00:00.000Z"),
      category: { name: "Paliwo" },
    });

    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "mbank",
    });

    expect(result).toEqual({
      ok: false,
      error: "Transakcja nie wymaga już weryfikacji",
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite a row that no longer matches the review queue", async () => {
    findFirst.mockResolvedValue({
      id: "tx-1",
      mbankCategory: "Transport",
      categoryId: "cat-current",
      mbankReviewResolvedAt: null,
      category: { name: "Transport" },
    });

    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "mbank",
    });

    expect(result).toEqual({
      ok: false,
      error: "Transakcja nie wymaga już weryfikacji",
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("reports a stale concurrent change when the guarded update misses", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const result = await persistReviewDecision({
      workspaceId: "ws-1",
      transactionId: "tx-1",
      decision: "mbank",
    });

    expect(result).toEqual({
      ok: false,
      error: "Transakcja została już zmieniona. Odśwież widok weryfikacji.",
    });
  });
});
