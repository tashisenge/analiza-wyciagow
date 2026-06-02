import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const resolveBulkAccountIds = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

vi.mock("@/lib/transactions/bulk-category-targets", () => ({
  resolveBulkAccountIds: (...args: unknown[]) => resolveBulkAccountIds(...args),
}));

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function matchingCandidate(id: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01T00:00:00.000Z"),
    counterparty: "Exact match",
    description: "already aligned",
    amount: { toString: () => "10" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-transport",
    mbankReviewResolvedAt: null,
    category: { name: "Transport" },
  };
}

function mismatchCandidate(id: string) {
  return {
    id,
    bookedAt: new Date("2026-01-02T00:00:00.000Z"),
    counterparty: "Needs review",
    description: "mismatch behind the scan window",
    amount: { toString: () => "20" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-car",
    mbankReviewResolvedAt: null,
    category: { name: "Samochód" },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBulkAccountIds.mockResolvedValue(["acc-1"]);
  });

  it("does not truncate real review rows after many broad DB candidates", async () => {
    findMany.mockImplementation(({ skip = 0 }: { skip?: number }) => {
      if (skip < 10_000) {
        return Promise.resolve(
          Array.from({ length: 250 }, (_, index) =>
            matchingCandidate(`match-${String(skip + index)}`),
          ),
        );
      }
      if (skip === 10_000) {
        return Promise.resolve([mismatchCandidate("tx-review")]);
      }
      return Promise.resolve([]);
    });

    const queue = await loadReviewQueue("ws-1");

    expect(queue.total).toBe(1);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]?.id).toBe("tx-review");
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10_000 }));
  });
});
