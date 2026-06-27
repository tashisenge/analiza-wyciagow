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

import { hasReviewQueueItems, loadReviewQueue } from "@/lib/review/load-review-queue";

function candidate(id: string, categoryName: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01T00:00:00.000Z"),
    counterparty: "Shop",
    description: "Payment",
    amount: { toString: () => "10.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: `cat-${categoryName}`,
    mbankReviewResolvedAt: null,
    category: { name: categoryName },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBulkAccountIds.mockResolvedValue(["acc-1"]);
  });

  it("continues scanning past ten thousand broad candidates for later review rows", async () => {
    findMany.mockImplementation((args: { skip?: number; take?: number }) => {
      const skip = args.skip ?? 0;
      const take = args.take ?? 250;
      if (skip < 10_000) {
        return Array.from({ length: take }, (_, offset) =>
          candidate(`false-${String(skip + offset)}`, "Transport"),
        );
      }
      if (skip === 10_000) {
        return [candidate("true-1", "Paliwo")];
      }
      return [];
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("true-1");
  });
});

describe("hasReviewQueueItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBulkAccountIds.mockResolvedValue(["acc-1"]);
  });

  it("uses a bounded scan for dashboard existence checks", async () => {
    findMany.mockImplementation((args: { skip?: number; take?: number }) => {
      const skip = args.skip ?? 0;
      const take = args.take ?? 250;
      if (skip <= 10_000) {
        return Array.from({ length: take }, (_, offset) =>
          candidate(`false-${String(skip + offset)}`, "Transport"),
        );
      }
      throw new Error("dashboard scan should be bounded");
    });

    await expect(hasReviewQueueItems("ws-1")).resolves.toBe(false);
  });
});
