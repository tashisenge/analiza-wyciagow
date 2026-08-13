import { describe, expect, it } from "vitest";

import { resolveDateRange } from "@/lib/analytics/date-range";
import {
  dashboardTransactionFetchStart,
  monthlyExpenseTrend,
} from "@/lib/analytics/monthly-trend";

describe("monthlyExpenseTrend", () => {
  it("returns 6 months of expense totals newest last", () => {
    const txs = [
      { bookedAt: new Date("2026-01-15"), amount: "-100" },
      { bookedAt: new Date("2026-02-10"), amount: "-50" },
    ];
    const trend = monthlyExpenseTrend(txs, new Date("2026-02-28"), 6);
    expect(trend).toHaveLength(6);
    expect(trend[5]?.total).toBe(50);
    expect(trend[4]?.total).toBe(100);
  });
});

describe("dashboardTransactionFetchStart", () => {
  it("extends the default month view to cover the 6-month trend window", () => {
    const now = new Date(2026, 7, 13);
    const range = resolveDateRange("month", now);
    const start = dashboardTransactionFetchStart(range.previousStart, range.currentEnd);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(2);
    expect(start.getDate()).toBe(1);
    expect(start.getTime()).toBeLessThan(range.previousStart.getTime());
  });

  it("keeps a wider previous period when it already covers the trend window", () => {
    const range = resolveDateRange("year", new Date(2026, 7, 13), { year: 2026 });
    const start = dashboardTransactionFetchStart(range.previousStart, range.currentEnd);

    expect(start.getTime()).toBe(range.previousStart.getTime());
  });

  it("extends an anchored past month so the 6-month trend is not truncated", () => {
    const range = resolveDateRange("month", new Date(2026, 7, 13), {
      year: 2026,
      month: 3,
    });
    const start = dashboardTransactionFetchStart(range.previousStart, range.currentEnd);

    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(9);
    expect(start.getDate()).toBe(1);
  });

  it("includes March spend in the August month-view trend after the fetch window is applied", () => {
    const now = new Date(2026, 7, 13);
    const range = resolveDateRange("month", now);
    const fetchStart = dashboardTransactionFetchStart(
      range.previousStart,
      range.currentEnd,
    );
    const txs = [
      { bookedAt: new Date(2026, 2, 15), amount: "-400" },
      { bookedAt: new Date(2026, 6, 10), amount: "-100" },
      { bookedAt: new Date(2026, 7, 5), amount: "-50" },
    ].filter((tx) => tx.bookedAt >= fetchStart && tx.bookedAt <= range.currentEnd);

    const trend = monthlyExpenseTrend(txs, range.currentEnd, 6);
    expect(trend.find((point) => point.month === "2026-03")?.total).toBe(400);
    expect(trend.find((point) => point.month === "2026-07")?.total).toBe(100);
    expect(trend.find((point) => point.month === "2026-08")?.total).toBe(50);
  });
});
