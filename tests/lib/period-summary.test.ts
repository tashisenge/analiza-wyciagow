import { describe, expect, it } from "vitest";

import { summarizePeriod } from "@/lib/analytics/period-summary";

describe("summarizePeriod", () => {
  it("sums expenses and income", () => {
    const summary = summarizePeriod([
      { amount: "-100.00" },
      { amount: "-50.25" },
      { amount: "3000.00" },
    ]);
    expect(summary.totalExpenses).toBe(150.25);
    expect(summary.totalIncome).toBe(3000);
    expect(summary.net).toBe(2849.75);
  });
});
