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

function transactionAt(index: number) {
  const isMismatch = index === 10_000;
  return {
    id: isMismatch ? "late-review-row" : `consistent-${String(index)}`,
    bookedAt: new Date(2026, 0, 1, 12, 0, 0 - index),
    counterparty: isMismatch ? "Mismatch Merchant" : "Consistent Merchant",
    description: "card payment",
    amount: { toString: () => "12.34" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId: isMismatch ? "cat-fuel" : "cat-transport",
    mbankReviewResolvedAt: null,
    category: { name: isMismatch ? "Paliwo" : "Transport" },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBulkAccountIds.mockResolvedValue(["acc-1"]);
    transactionFindMany.mockImplementation(
      ({ skip, take }: { skip: number; take: number }) => {
        const rows = Array.from(
          { length: Math.max(0, Math.min(take, 10_001 - skip)) },
          (_, i) => transactionAt(skip + i),
        );
        return Promise.resolve(rows);
      },
    );
  });

  it("continues scanning broad DB candidates until later review rows are found", async () => {
    const queue = await loadReviewQueue("workspace-1");

    expect(queue.total).toBe(1);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]?.id).toBe("late-review-row");
  });
});
