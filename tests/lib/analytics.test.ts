import { describe, expect, it } from "vitest";

import { categoryBreakdown } from "@/lib/analytics/category-breakdown";
import { accountIdsForContext } from "@/lib/analytics/filters";
import { topMerchants } from "@/lib/analytics/top-merchants";

describe("analytics", () => {
  const accounts = [
    { id: "a1", type: "dom" },
    { id: "a2", type: "firma" },
  ];

  it("filters account ids by context", () => {
    expect(accountIdsForContext(accounts, "dom")).toEqual(["a1"]);
    expect(accountIdsForContext(accounts, "razem")).toEqual(["a1", "a2"]);
  });

  it("builds category breakdown for expenses only", () => {
    const slices = categoryBreakdown([
      { amount: "-100", categoryId: "c1", categoryName: "Jedzenie" },
      { amount: "-50", categoryId: "c1", categoryName: "Jedzenie" },
      { amount: "200", categoryId: "c2", categoryName: "Przychód" },
    ]);
    expect(slices).toHaveLength(1);
    expect(slices[0]?.total).toBe(150);
    expect(slices[0]?.percent).toBe(100);
  });

  it("ranks top merchants with change percent", () => {
    const current = [
      { counterparty: "LIDL", amount: "-100" },
      { counterparty: "BOLT", amount: "-20" },
    ];
    const previous = [{ counterparty: "LIDL", amount: "-50" }];
    const rows = topMerchants(current, previous, 5);
    expect(rows[0]?.counterparty).toBe("LIDL");
    expect(rows[0]?.changePercent).toBe(100);
  });
});
