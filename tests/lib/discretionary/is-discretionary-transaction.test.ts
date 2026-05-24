import { describe, expect, it } from "vitest";

import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";

describe("isDiscretionaryExpense", () => {
  it("returns true for negative amount and discretionary category", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-50.00",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: true,
      }),
    ).toBe(true);
  });

  it("returns false for income", () => {
    expect(
      isDiscretionaryExpense({
        amount: "100.00",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: true,
      }),
    ).toBe(false);
  });

  it("returns false when category not discretionary", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-10",
        category: { isDiscretionary: false, name: "Żywność" },
        countsInAnalytics: true,
      }),
    ).toBe(false);
  });

  it("returns false when excluded from analytics", () => {
    expect(
      isDiscretionaryExpense({
        amount: "-10",
        category: { isDiscretionary: true, name: "Rozrywka" },
        countsInAnalytics: false,
      }),
    ).toBe(false);
  });
});
