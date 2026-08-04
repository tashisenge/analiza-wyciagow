import { describe, expect, it } from "vitest";

import { buildDashboardMetrics } from "@/lib/analytics/load-dashboard-metrics";

type MetricTx = Parameters<typeof buildDashboardMetrics>[0][number];

function tx(input: {
  id: string;
  accountId: string;
  amount: string;
  bookedAt: Date;
  categoryName?: string | null;
}): MetricTx {
  const categoryName = input.categoryName ?? null;
  return {
    id: input.id,
    workspaceId: "ws",
    accountId: input.accountId,
    importBatchId: null,
    dedupeHash: input.id,
    bookedAt: input.bookedAt,
    amount: input.amount as unknown as MetricTx["amount"],
    currency: "PLN",
    description: "Przelew własny",
    counterparty: "",
    mbankCategory: "",
    categoryId: categoryName ? `cat-${categoryName}` : null,
    mbankReviewResolvedAt: null,
    category: categoryName
      ? {
          id: `cat-${categoryName}`,
          workspaceId: "ws",
          name: categoryName,
          color: "#000",
          isDefault: false,
          excludeFromOptimization: false,
          isDiscretionary: false,
        }
      : null,
  };
}

describe("buildDashboardMetrics own-account transfer pairing", () => {
  it("excludes month-boundary own-account transfers from both period summaries", () => {
    const previous = [
      tx({
        id: "dom-in",
        accountId: "acc-dom",
        amount: "5000.00",
        bookedAt: new Date("2026-03-31T12:00:00.000Z"),
        categoryName: "Przychód",
      }),
    ];
    const current = [
      tx({
        id: "firma-out",
        accountId: "acc-firma",
        amount: "-5000.00",
        bookedAt: new Date("2026-04-01T12:00:00.000Z"),
        categoryName: "Inne",
      }),
      tx({
        id: "lidl",
        accountId: "acc-dom",
        amount: "-40.00",
        bookedAt: new Date("2026-04-02T12:00:00.000Z"),
        categoryName: "Żywność",
      }),
    ];

    const metrics = buildDashboardMetrics(current, previous, 0, 2);

    expect(metrics.summary.totalIncome).toBe(0);
    expect(metrics.summary.totalExpenses).toBe(40);
    expect(metrics.previousSummary.totalIncome).toBe(0);
    expect(metrics.previousSummary.totalExpenses).toBe(0);
  });

  it("still counts unpaired same-sign movements across the boundary", () => {
    const previous = [
      tx({
        id: "salary",
        accountId: "acc-dom",
        amount: "5000.00",
        bookedAt: new Date("2026-03-31T12:00:00.000Z"),
        categoryName: "Przychód",
      }),
    ];
    const current = [
      tx({
        id: "bonus",
        accountId: "acc-firma",
        amount: "5000.00",
        bookedAt: new Date("2026-04-01T12:00:00.000Z"),
        categoryName: "Przychód",
      }),
    ];

    const metrics = buildDashboardMetrics(current, previous, 0, 1);

    expect(metrics.summary.totalIncome).toBe(5000);
    expect(metrics.previousSummary.totalIncome).toBe(5000);
  });
});
