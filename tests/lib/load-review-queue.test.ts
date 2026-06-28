import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionFindMany = vi.fn();
const resolveBulkAccountIds = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => transactionFindMany(...args),
    },
  },
}));

vi.mock("@/lib/transactions/bulk-category-targets", () => ({
  resolveBulkAccountIds: (...args: unknown[]) => resolveBulkAccountIds(...args),
}));

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function makeCandidate(
  id: string,
  categoryName: string,
): {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString(): string };
  currency: string;
  mbankCategory: string;
  categoryId: string;
  mbankReviewResolvedAt: null;
  category: { name: string };
} {
  return {
    id,
    bookedAt: new Date("2026-06-01T00:00:00.000Z"),
    counterparty: "Counterparty",
    description: "Description",
    amount: { toString: () => "12.34" },
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
    resolveBulkAccountIds.mockResolvedValue(["account-1"]);
  });

  it("continues scanning candidates beyond 10000 rows", async () => {
    transactionFindMany.mockImplementation(({ skip }: { skip: number }) => {
      if (skip < 10_000) {
        return Promise.resolve(
          Array.from({ length: 250 }, (_, index) =>
            makeCandidate(`false-${String(skip + index)}`, "Transport"),
          ),
        );
      }
      if (skip === 10_000) {
        return Promise.resolve([makeCandidate("true-after-cap", "Paliwo")]);
      }
      return Promise.resolve([]);
    });

    const result = await loadReviewQueue("ws-1", 1);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("true-after-cap");
  });
});
