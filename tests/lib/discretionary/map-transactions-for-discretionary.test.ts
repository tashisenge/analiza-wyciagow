import { describe, expect, it } from "vitest";

import {
  discretionaryAmountPln,
  sumExpensePln,
  sumIncomePln,
} from "@/lib/discretionary/map-transactions-for-discretionary";

describe("map-transactions-for-discretionary", () => {
  it("parses discretionary expense amounts", () => {
    expect(discretionaryAmountPln("-123.45")).toBe(123.45);
    expect(discretionaryAmountPln("50")).toBe(0);
  });

  it("sums expenses and income in analytics scope", () => {
    const rows = [
      { amount: "-100", countsInAnalytics: true },
      { amount: "200", countsInAnalytics: true },
      { amount: "-50", countsInAnalytics: false },
    ];
    expect(sumExpensePln(rows)).toBe(100);
    expect(sumIncomePln(rows)).toBe(200);
  });
});
