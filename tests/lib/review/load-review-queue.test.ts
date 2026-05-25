import { beforeEach, describe, expect, it, vi } from "vitest";

interface ReviewCandidate {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  amount: { toString(): string };
  currency: string;
  mbankCategory: string;
  categoryId: string | null;
  category: { name: string } | null;
}

interface FindManyArgs {
  take?: number;
}

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

function candidate(
  id: string,
  mbankCategory: string,
  categoryName: string,
): ReviewCandidate {
  return {
    id,
    bookedAt: new Date("2026-05-01"),
    counterparty: "Merchant",
    description: "Payment",
    amount: { toString: () => "-10.00" },
    currency: "PLN",
    mbankCategory,
    categoryId: `cat-${id}`,
    category: { name: categoryName },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not hide real review rows behind the mapped-canonical candidate filter", async () => {
    const mappedCanonicalRows = Array.from({ length: 500 }, (_, index) =>
      candidate(`mapped-${String(index)}`, "Restauracje", "Rozrywka"),
    );
    const realMismatch = candidate("mismatch", "Transport", "Paliwo");
    const rows = [...mappedCanonicalRows, realMismatch];

    transactionFindMany.mockImplementation((args: FindManyArgs) =>
      Promise.resolve(typeof args.take === "number" ? rows.slice(0, args.take) : rows),
    );

    const result = await loadReviewQueue("ws-1", 1);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("mismatch");
  });
});
