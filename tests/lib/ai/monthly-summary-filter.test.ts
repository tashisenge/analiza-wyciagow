import { describe, expect, it } from "vitest";

import { buildMonthlySummary } from "@/lib/ai/monthly-summary";

describe("buildMonthlySummary with filtered transactions", () => {
  it("summarizes current month expenses", () => {
    const now = new Date();
    const rows = [
      {
        bookedAt: now,
        amount: { toString: () => "-250.50" },
        categoryId: "c1",
        counterparty: "Biedronka",
        category: { name: "Jedzenie" },
        mbankCategory: "",
      },
    ];
    const summary = buildMonthlySummary(rows, "test");
    expect(summary.totalExpenses).toBe(250.5);
    expect(summary.transactionCount).toBe(1);
    expect(summary.topCategories[0]?.name).toBe("Jedzenie");
  });
});
