import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

vi.mock("@/lib/transactions/bulk-category-targets", () => ({
  resolveBulkAccountIds: vi.fn().mockResolvedValue(["acc-1"]),
}));

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function reviewCandidate(partial: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    bookedAt: new Date("2026-01-01T00:00:00.000Z"),
    counterparty: "Merchant",
    description: "",
    amount: { toString: () => "10.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-transport",
    mbankReviewResolvedAt: null,
    category: { name: "Transport" },
    ...partial,
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not truncate review rows after many broad database candidates", async () => {
    findMany.mockImplementation(({ skip, take }: { skip: number; take: number }) => {
      if (skip < 10_000) {
        return Promise.resolve(
          Array.from({ length: take }, (_, index) =>
            reviewCandidate({ id: `exact-${skip + index}` }),
          ),
        );
      }
      if (skip === 10_000) {
        return Promise.resolve([
          reviewCandidate({
            id: "mismatch-after-cap",
            categoryId: "cat-car",
            category: { name: "Samochód" },
          }),
        ]);
      }
      return Promise.resolve([]);
    });

    const queue = await loadReviewQueue("ws-1");

    expect(queue.total).toBe(1);
    expect(queue.items.map((item) => item.id)).toEqual(["mismatch-after-cap"]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10_000 }));
  });
});
