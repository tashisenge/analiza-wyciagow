import { describe, expect, it } from "vitest";

import { aggregateDiscretionaryMerchants } from "@/lib/discretionary/aggregate-discretionary-merchants";
import { expenseCoveragePercent } from "@/lib/discretionary/expense-coverage-percent";

describe("aggregateDiscretionaryMerchants", () => {
  it("ranks top discretionary merchants in current period", () => {
    const tx = {
      amount: "-100",
      counterparty: "Netflix",
      tagNames: [],
      category: { isDiscretionary: true, name: "Rozrywka" },
      countsInAnalytics: true,
    };
    const rows = aggregateDiscretionaryMerchants([tx], [], 5);
    expect(rows).toEqual([
      {
        counterparty: "Netflix",
        totalPln: 100,
        transactionCount: 1,
        vsPreviousPeriodPercent: 100,
      },
    ]);
  });
});

describe("expenseCoveragePercent", () => {
  it("returns share of categorized expenses", () => {
    const pairedKeys = new Set<string>();
    const current = [
      {
        id: "1",
        amount: "-10",
        categoryId: "cat-1",
        category: { name: "Jedzenie" },
      },
      {
        id: "2",
        amount: "-20",
        categoryId: null,
        category: null,
      },
    ];
    expect(expenseCoveragePercent(current, pairedKeys)).toBe(50);
  });

  it("returns 100 when there are no expenses", () => {
    expect(expenseCoveragePercent([], new Set())).toBe(100);
  });
});
