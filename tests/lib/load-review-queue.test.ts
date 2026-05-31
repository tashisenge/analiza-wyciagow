import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountFindMany: vi.fn(),
  transactionFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findMany: (...args: unknown[]) => mocks.accountFindMany(...args),
    },
    transaction: {
      findMany: (...args: unknown[]) => mocks.transactionFindMany(...args),
    },
  },
}));

import { loadReviewQueue } from "@/lib/review/load-review-queue";

function reviewCandidate(partial: {
  id: string;
  categoryId?: string | null;
  categoryName?: string | null;
}) {
  const categoryId = partial.categoryId ?? "cat-transport";
  const categoryName = partial.categoryName ?? "Transport";

  return {
    id: partial.id,
    bookedAt: new Date("2026-01-01"),
    counterparty: "Merchant",
    description: "Card payment",
    amount: { toString: () => "-10.00" },
    currency: "PLN",
    mbankCategory: "Transport",
    categoryId,
    mbankReviewResolvedAt: null,
    category: categoryName ? { name: categoryName } : null,
  };
}

describe("loadReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accountFindMany.mockResolvedValue([{ id: "acc-1", type: "dom" }]);
  });

  it("continues scanning until later true review rows are found", async () => {
    const rows = [
      ...Array.from({ length: 10_000 }, (_, index) =>
        reviewCandidate({ id: `already-matching-${String(index)}` }),
      ),
      reviewCandidate({ id: "needs-review", categoryName: "Inne" }),
    ];
    mocks.transactionFindMany.mockImplementation(
      (args: { skip?: number; take?: number }) => {
        const skip = args.skip ?? 0;
        const take = args.take ?? 250;
        return Promise.resolve(rows.slice(skip, skip + take));
      },
    );

    const result = await loadReviewQueue("ws-1");

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["needs-review"]);
  });
});
