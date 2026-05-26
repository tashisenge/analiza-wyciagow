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

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function nonReviewCandidate(index: number) {
  return {
    id: `tx-ok-${String(index)}`,
    bookedAt: new Date(`2026-05-${String(26 - (index % 20)).padStart(2, "0")}T00:00:00Z`),
    counterparty: "Tramwaje",
    description: "Bilet",
    amount: { toString: () => "-4.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-transport",
    mbankReviewResolvedAt: null,
    category: { name: "Transport" },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not drop review rows after the first 500 broad candidates", async () => {
    const candidates = [
      ...Array.from({ length: 500 }, (_, index) => nonReviewCandidate(index)),
      {
        id: "tx-needs-review",
        bookedAt: new Date("2026-04-01T00:00:00Z"),
        counterparty: "Taxi",
        description: "Przejazd",
        amount: { toString: () => "-32.00" },
        currency: "PLN",
        mbankCategory: "Transport",
        categoryId: null,
        mbankReviewResolvedAt: null,
        category: null,
      },
    ];
    transactionFindMany.mockImplementation((args: { skip?: number; take?: number }) => {
      const skip = args.skip ?? 0;
      const take = args.take ?? candidates.length;
      return Promise.resolve(candidates.slice(skip, skip + take));
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("tx-needs-review");
  });
});
