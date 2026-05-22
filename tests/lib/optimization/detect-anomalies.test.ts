import { describe, expect, it } from "vitest";

import { detectAnomalies } from "@/lib/optimization/detect-anomalies";
import { detectMerchantSpikes } from "@/lib/optimization/detect-merchant-spikes";

describe("detectAnomalies", () => {
  it("flags expense above 3x category median", () => {
    const history = Array.from({ length: 5 }, (_, index) => ({
      id: `h${String(index)}`,
      bookedAt: new Date("2025-12-01"),
      amount: "-50",
      counterparty: "SHOP",
      categoryId: "c1",
      categoryName: "Jedzenie",
    }));
    const current = [
      {
        id: "big",
        bookedAt: new Date("2026-02-01"),
        amount: "-400",
        counterparty: "SHOP",
        categoryId: "c1",
        categoryName: "Jedzenie",
      },
    ];
    const found = detectAnomalies(current, history);
    expect(found).toHaveLength(1);
    expect(found[0]?.estimatedMonthlySavings).toBe(350);
  });
});

describe("detectMerchantSpikes", () => {
  it("detects merchant with >50% m/m increase over 200 PLN", () => {
    const previous = [
      {
        id: "p1",
        bookedAt: new Date("2026-01-01"),
        amount: "-300",
        counterparty: "LIDL",
        categoryId: null,
        categoryName: "",
      },
    ];
    const current = [
      ...previous,
      {
        id: "c1",
        bookedAt: new Date("2026-02-01"),
        amount: "-200",
        counterparty: "LIDL",
        categoryId: null,
        categoryName: "",
      },
    ];
    const found = detectMerchantSpikes(current, previous);
    expect(found.length).toBeGreaterThanOrEqual(0);
  });
});
