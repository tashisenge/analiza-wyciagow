import { describe, expect, it } from "vitest";

import { monthlyExpenseTrend } from "@/lib/analytics/monthly-trend";

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
