import { describe, expect, it } from "vitest";

import { detectRecurring } from "@/lib/optimization/detect-recurring";

describe("detectRecurring", () => {
  it("detects same counterparty within 5% amount at least 3 times", () => {
    const txs = [
      {
        id: "1",
        counterparty: "NETFLIX",
        amount: "-49.99",
        bookedAt: new Date("2026-01-05"),
        categoryId: null,
        categoryName: "Rozrywka",
      },
      {
        id: "2",
        counterparty: "NETFLIX",
        amount: "-49.99",
        bookedAt: new Date("2026-02-05"),
        categoryId: null,
        categoryName: "Rozrywka",
      },
      {
        id: "3",
        counterparty: "NETFLIX",
        amount: "-49.99",
        bookedAt: new Date("2026-03-05"),
        categoryId: null,
        categoryName: "Rozrywka",
      },
    ];
    const found = detectRecurring(
      txs,
      { minOccurrences: 3, amountTolerancePercent: 5 },
      new Date("2026-03-15"),
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.estimatedMonthlySavings).toBeCloseTo(49.99, 2);
  });
});
