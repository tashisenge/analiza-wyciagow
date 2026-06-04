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
  resolveBulkAccountIds: vi.fn().mockResolvedValue(["acc-1"]),
}));

import { hasReviewQueueItems, loadReviewQueue } from "@/lib/review/load-review-queue";

function reviewCandidate(overrides: { id: string; categoryName: string | null }): {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString(): string };
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  mbankReviewResolvedAt: Date | null;
  category: { name: string } | null;
} {
  return {
    id: overrides.id,
    bookedAt: new Date("2026-01-01T00:00:00.000Z"),
    counterparty: "Shop",
    description: "Card payment",
    amount: { toString: () => "-10" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-1",
    mbankReviewResolvedAt: null,
    category: overrides.categoryName ? { name: overrides.categoryName } : null,
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("continues scanning DB batches until a late review-eligible row is found", async () => {
    transactionFindMany.mockImplementation((args: { skip: number; take: number }) => {
      if (args.skip < 10_000) {
        return Promise.resolve(
          Array.from({ length: args.take }, (_, index) =>
            reviewCandidate({
              id: `already-matched-${String(args.skip + index)}`,
              categoryName: "Transport",
            }),
          ),
        );
      }
      if (args.skip === 10_000) {
        return Promise.resolve([
          reviewCandidate({ id: "late-mismatch", categoryName: "Paliwo" }),
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("late-mismatch");
    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10_000 }),
    );
  });

  it("bounds the dashboard review indicator scan", async () => {
    transactionFindMany.mockImplementation((args: { skip: number; take: number }) => {
      expect(args.skip).toBeLessThan(1_000);
      return Promise.resolve(
        Array.from({ length: args.take }, (_, index) =>
          reviewCandidate({
            id: `already-matched-${String(args.skip + index)}`,
            categoryName: "Transport",
          }),
        ),
      );
    });

    await expect(hasReviewQueueItems("ws-1")).resolves.toBe(false);
    expect(transactionFindMany).toHaveBeenCalledTimes(4);
  });
});
