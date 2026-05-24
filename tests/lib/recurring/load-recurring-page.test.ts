import { describe, expect, it } from "vitest";

import { rankOpportunities } from "@/lib/optimization/rank-opportunities";
import type { DetectedOpportunity } from "@/lib/optimization/types";
import { MAX_OPPORTUNITIES } from "@/lib/optimization/types";

function makeOpportunity(
  type: DetectedOpportunity["type"],
  savings: number,
  dedupeKey: string,
): DetectedOpportunity {
  return {
    type,
    title: dedupeKey,
    description: "",
    estimatedMonthlySavings: savings,
    counterparty: dedupeKey,
    categoryId: null,
    evidenceTransactionIds: [],
    dedupeKey,
  };
}

describe("rankOpportunities recurring retention", () => {
  it("keeps all recurring and subscription suspects when ranking", () => {
    const recurring = Array.from({ length: 12 }, (_, index) =>
      makeOpportunity("RECURRING", 100 - index, `r-${String(index)}`),
    );
    const anomalies = Array.from({ length: 15 }, (_, index) =>
      makeOpportunity("ANOMALY", 50 - index, `a-${String(index)}`),
    );
    const ranked = rankOpportunities([...anomalies, ...recurring]);
    const recurringCount = ranked.filter(
      (item) => item.type === "RECURRING" || item.type === "SUBSCRIPTION",
    ).length;
    expect(recurringCount).toBe(12);
    expect(ranked.length).toBe(12 + Math.min(15, MAX_OPPORTUNITIES - 12));
  });
});
