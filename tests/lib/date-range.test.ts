import { describe, expect, it } from "vitest";

import { resolveDateRange } from "@/lib/analytics/date-range";

describe("resolveDateRange", () => {
  it("returns current and previous month", () => {
    const now = new Date("2026-05-15T12:00:00");
    const range = resolveDateRange("month", now);
    expect(range.currentStart.getMonth()).toBe(4);
    expect(range.previousStart.getMonth()).toBe(3);
    expect(range.currentEnd.getTime()).toBeGreaterThan(range.currentStart.getTime());
  });

  it("defaults to month for unknown period", () => {
    const range = resolveDateRange("invalid", new Date("2026-05-15"));
    expect(range.label).toContain("2026");
  });

  it("supports quarter preset", () => {
    const range = resolveDateRange("quarter", new Date("2026-05-15"));
    expect(range.currentStart.getMonth()).toBe(3);
  });
});
