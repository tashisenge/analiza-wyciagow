import { describe, expect, it } from "vitest";

import { filterTransactionsForInsight } from "@/lib/ai/filter-insight-transactions";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

function makeTx(options: {
  id: string;
  accountId: string;
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  bookedAt?: Date;
}) {
  return {
    id: options.id,
    accountId: options.accountId,
    amount: { toString: () => options.amount },
    currency: "PLN",
    bookedAt: options.bookedAt ?? new Date("2026-05-10"),
    categoryId: options.categoryId,
    counterparty: "Test",
    mbankCategory: "",
    category: options.categoryName ? { name: options.categoryName } : null,
  };
}

describe("filterTransactionsForInsight", () => {
  it("removes paired own-account transfers", () => {
    const rows = [
      makeTx({
        id: "a1",
        accountId: "acc-dom",
        amount: "-1000",
        categoryId: "c1",
        categoryName: "Jedzenie",
      }),
      makeTx({
        id: "a2",
        accountId: "acc-firma",
        amount: "1000",
        categoryId: "c1",
        categoryName: "Jedzenie",
      }),
    ];
    const result = filterTransactionsForInsight(rows, []);
    expect(result.included).toHaveLength(0);
    expect(result.transfersFiltered).toBe(2);
  });

  it("removes excluded category ids", () => {
    const rows = [
      makeTx({
        id: "x1",
        accountId: "acc-dom",
        amount: "-50",
        categoryId: "excluded",
        categoryName: "Oszczędności",
      }),
    ];
    const result = filterTransactionsForInsight(rows, ["excluded"]);
    expect(result.included).toHaveLength(0);
    expect(result.excludedByCategory).toBe(1);
  });

  it("removes transfer category by name", () => {
    const rows = [
      makeTx({
        id: "t1",
        accountId: "acc-dom",
        amount: "-200",
        categoryId: "c-tr",
        categoryName: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
      }),
    ];
    const result = filterTransactionsForInsight(rows, []);
    expect(result.included).toHaveLength(0);
    expect(result.transfersFiltered).toBe(1);
  });
});
