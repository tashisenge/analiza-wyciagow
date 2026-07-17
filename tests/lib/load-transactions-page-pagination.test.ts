import { beforeEach, describe, expect, it, vi } from "vitest";

const accountFindMany = vi.fn();
const fetchTransactionsPageBundle = vi.fn();
const loadPairedOwnAccountTransferKeys = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    account: {
      findMany: (...args: unknown[]) => accountFindMany(...args),
    },
  },
}));

vi.mock("@/lib/transactions/fetch-transactions-page-bundle", () => ({
  fetchTransactionsPageBundle: (...args: unknown[]) =>
    fetchTransactionsPageBundle(...args),
}));

vi.mock("@/lib/transactions/load-workspace-transfer-pairs", () => ({
  loadPairedOwnAccountTransferKeys: (...args: unknown[]) =>
    loadPairedOwnAccountTransferKeys(...args),
}));

import { loadTransactionsPageData } from "@/lib/transactions/load-transactions-page";

function transaction(id: string, counterparty: string, bookedAt: Date) {
  return {
    id,
    accountId: "account-1",
    bookedAt,
    counterparty,
    description: "",
    mbankCategory: "",
    amount: { toString: () => "-10.00" },
    currency: "PLN",
    categoryId: null,
    category: null,
    account: { type: "dom" },
    tags: [],
  };
}

describe("loadTransactionsPageData similar sorting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountFindMany.mockResolvedValue([{ id: "account-1", type: "dom" }]);
    loadPairedOwnAccountTransferKeys.mockResolvedValue(new Set());
  });

  it("sorts the full comparison scope before slicing a page", async () => {
    const uniqueRecent = Array.from({ length: 60 }, (_, index) =>
      transaction(
        `unique-${String(index)}`,
        `Unique ${String(index)}`,
        new Date(2026, 2, 2, 0, index),
      ),
    );
    const repeatedOlder = Array.from({ length: 60 }, (_, index) =>
      transaction(
        `repeat-${String(index)}`,
        "Repeated merchant",
        new Date(2026, 2, 1, 0, index),
      ),
    );
    fetchTransactionsPageBundle.mockResolvedValue({
      transactions: [...uniqueRecent, ...repeatedOlder],
      categories: [],
      filterCategory: null,
      transferCategoryId: "transfer-category",
      allTags: [],
      subscriptionMarkers: [],
      nextCursor: null,
      prevCursor: null,
    });

    const result = await loadTransactionsPageData("workspace-1", "dom", {
      sort: "similar",
      sortDir: "desc",
    });

    expect(result.rows).toHaveLength(50);
    expect(result.rows.every((row) => row.counterparty === "Repeated merchant")).toBe(
      true,
    );
    expect(result.nextCursor).toBe("off:50");
    expect(result.prevCursor).toBeNull();
  });

  it("builds later pages from the globally sorted comparison scope", async () => {
    const uniqueRecent = Array.from({ length: 60 }, (_, index) =>
      transaction(
        `unique-${String(index)}`,
        `Unique ${String(index)}`,
        new Date(2026, 2, 2, 0, index),
      ),
    );
    const repeatedOlder = Array.from({ length: 60 }, (_, index) =>
      transaction(
        `repeat-${String(index)}`,
        "Repeated merchant",
        new Date(2026, 2, 1, 0, index),
      ),
    );
    fetchTransactionsPageBundle.mockResolvedValue({
      transactions: [...uniqueRecent, ...repeatedOlder],
      categories: [],
      filterCategory: null,
      transferCategoryId: "transfer-category",
      allTags: [],
      subscriptionMarkers: [],
      nextCursor: null,
      prevCursor: null,
    });

    const result = await loadTransactionsPageData("workspace-1", "dom", {
      sort: "similar",
      sortDir: "desc",
      cursor: "off:50",
    });

    expect(result.rows).toHaveLength(50);
    expect(
      result.rows.filter((row) => row.counterparty === "Repeated merchant"),
    ).toHaveLength(10);
    expect(result.nextCursor).toBe("off:100");
    expect(result.prevCursor).toBeNull();
  });
});
