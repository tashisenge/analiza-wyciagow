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

function candidate(id: string, categoryName: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01"),
    counterparty: "Merchant",
    description: "",
    amount: { toString: () => "10.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: "cat-transport",
    mbankReviewResolvedAt: null,
    category: { name: categoryName },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBulkAccountIds.mockResolvedValue(["acc-1"]);
  });

  it("continues scanning until the database result set is exhausted", async () => {
    findMany.mockImplementation(({ skip }: { skip: number }) => {
      if (skip < 10_000) {
        return Array.from({ length: 250 }, (_, index) =>
          candidate(`matching-${String(skip + index)}`, "Transport"),
        );
      }
      if (skip === 10_000) {
        return [candidate("late-review-row", "Fuel")];
      }
      return [];
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["late-review-row"]);
  });
});
