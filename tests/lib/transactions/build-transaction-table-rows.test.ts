import { describe, expect, it } from "vitest";

import { buildTransactionTableRows } from "@/lib/transactions/build-transaction-table-rows";

class DecimalLike {
  constructor(private readonly raw: string) {}

  toString(): string {
    return this.raw;
  }
}

describe("buildTransactionTableRows", () => {
  it("turns Decimal amounts into strings before they reach a client component", () => {
    const rows = buildTransactionTableRows({
      transactions: [
        {
          id: "tx-1",
          accountId: "acc-1",
          bookedAt: new Date("2026-05-20T00:00:00.000Z"),
          counterparty: "Lidl",
          description: "LIDL ZAKUP",
          mbankCategory: "Żywność",
          amount: new DecimalLike("-13.38"),
          currency: "PLN",
          categoryId: null,
          category: null,
          account: { type: "dom" },
        },
      ],
      transferCategoryId: "transfer",
      similarCounts: new Map(),
      pairedTransferKeys: new Set(),
    });

    expect(rows[0]?.amount).toBe("-13.38");
    expect(typeof rows[0]?.amount).toBe("string");
  });
});
