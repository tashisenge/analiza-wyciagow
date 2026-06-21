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

function nonReviewRow(id: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01"),
    counterparty: "Known merchant",
    description: "",
    amount: { toString: () => "10.00" },
    currency: "PLN",
    mbankCategory: "Food",
    categoryId: "cat-food",
    mbankReviewResolvedAt: null,
    category: { name: "Food" },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("continues scanning after 10000 non-review candidates", async () => {
    transactionFindMany.mockImplementation(({ skip }: { skip: number }) => {
      if (skip < 10_000) {
        return Array.from({ length: 250 }, (_, index) =>
          nonReviewRow(`false-${String(skip + index)}`),
        );
      }
      if (skip === 10_000) {
        return [
          {
            ...nonReviewRow("review-late"),
            counterparty: "Late mismatch",
            mbankCategory: "Transport",
            category: { name: "Fuel" },
          },
        ];
      }
      return [];
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["review-late"]);
    expect(transactionFindMany).toHaveBeenCalledTimes(41);
  });
});
