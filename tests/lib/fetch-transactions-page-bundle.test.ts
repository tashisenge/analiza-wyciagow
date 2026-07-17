import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionFindMany = vi.fn();
const categoryFindMany = vi.fn();
const categoryFindFirst = vi.fn();
const tagFindMany = vi.fn();
const subscriptionMarkerFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      findMany: (...args: unknown[]) => transactionFindMany(...args),
    },
    category: {
      findMany: (...args: unknown[]) => categoryFindMany(...args),
      findFirst: (...args: unknown[]) => categoryFindFirst(...args),
    },
    tag: {
      findMany: (...args: unknown[]) => tagFindMany(...args),
    },
    subscriptionMarker: {
      findMany: (...args: unknown[]) => subscriptionMarkerFindMany(...args),
    },
  },
}));

vi.mock("@/lib/categories/ensure-transfer-category", () => ({
  ensureTransferCategory: vi.fn().mockResolvedValue("transfer-category"),
}));

import { fetchTransactionsPageBundle } from "@/lib/transactions/fetch-transactions-page-bundle";

describe("fetchTransactionsPageBundle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryFindMany.mockResolvedValue([]);
    categoryFindFirst.mockResolvedValue(null);
    tagFindMany.mockResolvedValue([]);
    subscriptionMarkerFindMany.mockResolvedValue([]);
  });

  it("keeps the legacy 200-row comparison scope for similar sorting", async () => {
    transactionFindMany.mockResolvedValue(
      Array.from({ length: 200 }, (_, index) => ({
        id: `tx-${String(index)}`,
        bookedAt: new Date(2026, 0, 1, 0, 0, index),
      })),
    );

    const bundle = await fetchTransactionsPageBundle("workspace-1", ["account-1"], {
      sort: "similar",
      sortDir: "desc",
    });

    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 200,
        skip: 0,
      }),
    );
    expect(bundle.transactions).toHaveLength(200);
    expect(bundle.nextCursor).toBeNull();
    expect(bundle.prevCursor).toBeNull();
  });

  it("does not skip rows before sorting a later similar page", async () => {
    transactionFindMany.mockResolvedValue(
      Array.from({ length: 200 }, (_, index) => ({
        id: `tx-${String(index)}`,
        bookedAt: new Date(2026, 0, 1, 0, 0, index),
      })),
    );

    await fetchTransactionsPageBundle("workspace-1", ["account-1"], {
      sort: "similar",
      sortDir: "desc",
      cursor: "off:50",
    });

    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 200,
        skip: 0,
      }),
    );
  });
});
