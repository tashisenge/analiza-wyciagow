import { describe, expect, it } from "vitest";

import { aggregateSavingsImpact } from "@/lib/optimization/aggregate-savings-impact";

describe("aggregateSavingsImpact", () => {
  it("sums verified monthly savings and counts pending", () => {
    const summary = aggregateSavingsImpact([
      { savingsVerified: true, estimatedMonthlySavings: { toString: () => "100" } },
      { savingsVerified: true, estimatedMonthlySavings: { toString: () => "50.5" } },
      { savingsVerified: false, estimatedMonthlySavings: { toString: () => "200" } },
    ]);
    expect(summary).toEqual({
      totalImplemented: 3,
      verifiedCount: 2,
      verifiedMonthlySavingsPln: 150.5,
      pendingVerificationCount: 1,
    });
  });

  it("returns zeros for empty list", () => {
    expect(aggregateSavingsImpact([])).toEqual({
      totalImplemented: 0,
      verifiedCount: 0,
      verifiedMonthlySavingsPln: 0,
      pendingVerificationCount: 0,
    });
  });
});
