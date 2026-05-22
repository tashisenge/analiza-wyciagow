import { describe, expect, it } from "vitest";

import { buildSimilarCountByTransactionId } from "@/lib/transactions/similar-transaction-count";

describe("buildSimilarCountByTransactionId", () => {
  it("counts other rows with same counterparty", () => {
    const map = buildSimilarCountByTransactionId([
      { id: "a", counterparty: "NETFLIX" },
      { id: "b", counterparty: "NETFLIX" },
      { id: "c", counterparty: "LIDL" },
    ]);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(1);
    expect(map.get("c")).toBe(0);
  });

  it("returns zero for empty counterparty", () => {
    const map = buildSimilarCountByTransactionId([{ id: "x", counterparty: "  " }]);
    expect(map.get("x")).toBe(0);
  });
});
