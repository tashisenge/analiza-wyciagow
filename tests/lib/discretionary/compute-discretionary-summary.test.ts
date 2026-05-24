import { describe, expect, it } from "vitest";

import { computeDiscretionarySummary } from "@/lib/discretionary/compute-discretionary-summary";

describe("computeDiscretionarySummary", () => {
  it("sums discretionary expenses and share of all expenses", () => {
    const result = computeDiscretionarySummary({
      currentDiscretionaryPln: 300,
      currentDiscretionaryCount: 5,
      currentTotalExpensesPln: 1000,
      previousDiscretionaryPln: 200,
    });
    expect(result.totalPln).toBe(300);
    expect(result.transactionCount).toBe(5);
    expect(result.shareOfExpensesPercent).toBe(30);
    expect(result.vsPreviousPeriodPercent).toBe(50);
  });

  it("returns null share when no expenses", () => {
    const result = computeDiscretionarySummary({
      currentDiscretionaryPln: 0,
      currentDiscretionaryCount: 0,
      currentTotalExpensesPln: 0,
      previousDiscretionaryPln: 0,
    });
    expect(result.shareOfExpensesPercent).toBeNull();
    expect(result.vsPreviousPeriodPercent).toBeNull();
  });
});
