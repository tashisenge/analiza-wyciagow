import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadReviewQueue } from "@/lib/review/load-review-queue";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/transactions/bulk-category-targets", () => ({
  resolveBulkAccountIds: vi.fn().mockResolvedValue(["acc-1"]),
}));

function reviewCandidate(
  id: string,
  categoryId: string | null = null,
): {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString: () => string };
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  mbankReviewResolvedAt: null;
  category: null;
} {
  return {
    id,
    bookedAt: new Date("2026-01-01"),
    counterparty: "Merchant",
    description: "",
    amount: { toString: () => "10.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId,
    mbankReviewResolvedAt: null,
    category: null,
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("clamps requested page to the last non-empty page", async () => {
    findManyMock
      .mockResolvedValueOnce(
        Array.from({ length: 51 }, (_, index) => reviewCandidate(`tx-${String(index)}`)),
      )
      .mockResolvedValueOnce([]);

    const queue = await loadReviewQueue("ws-1", 3);

    expect(queue.total).toBe(51);
    expect(queue.page).toBe(2);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]?.id).toBe("tx-50");
  });

  it("does not silently stop before later review candidates", async () => {
    const nonReviewBatch = Array.from({ length: 250 }, (_, index) =>
      reviewCandidate(`matched-${String(index)}`, "cat-1"),
    );
    for (let index = 0; index < 40; index += 1) {
      findManyMock.mockResolvedValueOnce(nonReviewBatch);
    }
    findManyMock.mockResolvedValueOnce([reviewCandidate("late-review")]);

    const queue = await loadReviewQueue("ws-1", 1);

    expect(queue.total).toBe(1);
    expect(queue.items.map((item) => item.id)).toEqual(["late-review"]);
  });
});
