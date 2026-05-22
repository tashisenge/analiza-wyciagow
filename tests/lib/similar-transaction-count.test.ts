import { describe, expect, it } from "vitest";

import { buildSimilarCountsByTransactionId } from "@/lib/transactions/similar-transaction-count";

describe("buildSimilarCountsByTransactionId", () => {
  it("counts counterparty and amount matches separately", () => {
    const map = buildSimilarCountsByTransactionId([
      { id: "a", counterparty: "NETFLIX", amount: "-49.00", currency: "PLN" },
      { id: "b", counterparty: "NETFLIX", amount: "-49.00", currency: "PLN" },
      { id: "c", counterparty: "NETFLIX", amount: "-99.00", currency: "PLN" },
    ]);
    expect(map.get("a")).toEqual({ byCounterparty: 2, byCounterpartyAndAmount: 1 });
    expect(map.get("c")).toEqual({ byCounterparty: 2, byCounterpartyAndAmount: 0 });
  });

  it("returns zero for empty counterparty", () => {
    const map = buildSimilarCountsByTransactionId([
      { id: "x", counterparty: "  ", amount: "10.00", currency: "PLN" },
    ]);
    expect(map.get("x")).toEqual({ byCounterparty: 0, byCounterpartyAndAmount: 0 });
  });
});
