import { describe, expect, it } from "vitest";

import {
  buildYearlyMonthSummaries,
  categorySliceKey,
  mapRecurringPayments,
} from "@/lib/analytics/dashboard-extras";
import { parseDashboardParams, buildDashboardHref } from "@/lib/analytics/dashboard-params";

describe("dashboard params", () => {
  it("parses year and month", () => {
    const parsed = parseDashboardParams({ context: "dom", period: "month", year: "2025", month: "3" });
    expect(parsed.context).toBe("dom");
    expect(parsed.year).toBe(2025);
    expect(parsed.month).toBe(3);
  });

  it("builds dashboard href with month", () => {
    expect(buildDashboardHref({ context: "razem", period: "month", year: 2025, month: 3 })).toBe(
      "/dashboard?context=razem&period=month&year=2025&month=3",
    );
  });
});

describe("dashboard extras", () => {
  it("builds yearly month summaries", () => {
    const points = buildYearlyMonthSummaries(
      [
        { bookedAt: new Date("2025-01-10"), amount: "-100" },
        { bookedAt: new Date("2025-02-10"), amount: "-50" },
      ],
      2025,
    );
    expect(points).toHaveLength(12);
    expect(points[0]?.total).toBe(100);
    expect(points[1]?.total).toBe(50);
  });

  it("maps recurring payments with subscription markers", () => {
    const rows = mapRecurringPayments(
      [
        {
          id: "1",
          title: "Netflix",
          type: "SUBSCRIPTION",
          counterparty: "NETFLIX",
          estimatedMonthlySavings: { toString: () => "49" },
        },
      ],
      new Set(["NETFLIX"]),
    );
    expect(rows[0]?.isMarkedSubscription).toBe(true);
  });

  it("creates stable category slice keys", () => {
    expect(categorySliceKey("c1", "Jedzenie")).toBe("c1");
    expect(categorySliceKey(null, "Bez kategorii")).toBe("name:Bez kategorii");
  });
});
