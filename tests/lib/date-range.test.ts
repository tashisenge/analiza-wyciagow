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

  it("supports anchored month", () => {
    const range = resolveDateRange("month", new Date("2026-05-15"), {
      year: 2026,
      month: 3,
    });
    expect(range.currentStart.getMonth()).toBe(2);
    expect(range.currentEnd.getMonth()).toBe(2);
    expect(range.label.toLowerCase()).toContain("marz");
  });

  it("supports full calendar year", () => {
    const range = resolveDateRange("year", new Date("2026-05-15"), { year: 2025 });
    expect(range.isFullYear).toBe(true);
    expect(range.currentStart.getFullYear()).toBe(2025);
    expect(range.currentEnd.getMonth()).toBe(11);
  });

  it("uses YTD for current year", () => {
    const range = resolveDateRange("year", new Date("2026-05-15"), { year: 2026 });
    expect(range.isFullYear).toBe(false);
    expect(range.currentEnd.getMonth()).toBe(4);
  });
});
