import { describe, expect, it } from "vitest";

import { buildOpportunities } from "@/lib/optimization/build-opportunities";
import { MAX_OPPORTUNITIES } from "@/lib/optimization/types";

describe("buildOpportunities", () => {
  it("returns sorted list capped at max opportunities", () => {
    const txs = Array.from({ length: 3 }, (_, index) => ({
      id: String(index),
      counterparty: "NETFLIX",
      amount: "-49.99",
      bookedAt: new Date(`2026-0${String(index + 1)}-05`),
      categoryId: "c1",
      categoryName: "Rozrywka",
    }));
    const result = buildOpportunities({
      current: txs,
      history: [],
      budgets: [],
      anchor: new Date("2026-03-15"),
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(MAX_OPPORTUNITIES);
    const savings = result.map((item) => item.estimatedMonthlySavings ?? 0);
    const sorted = [...savings].sort((a, b) => b - a);
    expect(savings).toEqual(sorted);
  });
});
