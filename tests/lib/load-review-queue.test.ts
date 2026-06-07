import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => transactionFindMany(...args),
    },
  },
}));

vi.mock("@/lib/transactions/bulk-category-targets", () => ({
  resolveBulkAccountIds: vi.fn().mockResolvedValue(["account-1"]),
}));

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function matchingCandidate(id: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01T00:00:00.000Z"),
    counterparty: "Transit",
    description: "Bus ticket",
    amount: { toString: () => "12.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: null,
    mbankReviewResolvedAt: null,
    category: null,
  };
}

function falseCandidate(id: string) {
  return {
    ...matchingCandidate(id),
    categoryId: "cat-transport",
    category: { name: "Transport" },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("continues scanning until the database is exhausted, not just the first 10000 candidates", async () => {
    transactionFindMany.mockImplementation((args: { skip: number; take: number }) => {
      if (args.skip < 10_000) {
        return Promise.resolve(
          Array.from({ length: args.take }, (_, index) =>
            falseCandidate(`false-${String(args.skip + index)}`),
          ),
        );
      }
      if (args.skip === 10_000) {
        return Promise.resolve([matchingCandidate("tx-after-10000")]);
      }
      return Promise.resolve([]);
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("tx-after-10000");
    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10_000 }),
    );
  });
});
