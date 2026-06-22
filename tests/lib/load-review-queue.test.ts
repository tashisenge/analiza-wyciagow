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

function makeCandidate(id: string, mbankCategory: string, appCategory: string) {
  return {
    id,
    bookedAt: new Date("2026-01-01"),
    counterparty: "Merchant",
    description: "Payment",
    amount: { toString: () => "-10.00" },
    currency: "PLN",
    mbankCategory,
    categoryId: `cat-${appCategory}`,
    mbankReviewResolvedAt: null,
    category: { name: appCategory },
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps scanning until a review item after 10000 non-review candidates is found", async () => {
    const falseCandidates = Array.from({ length: 10_000 }, (_, index) =>
      makeCandidate(`tx-ok-${String(index)}`, "Transport", "Transport"),
    );
    const reviewCandidate = makeCandidate("tx-review", "Transport", "Paliwo");
    const rows = [...falseCandidates, reviewCandidate];

    transactionFindMany.mockImplementation((args: { skip?: number; take?: number }) => {
      const skip = args.skip ?? 0;
      const take = args.take ?? rows.length;
      return Promise.resolve(rows.slice(skip, skip + take));
    });

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("tx-review");
  });
});
