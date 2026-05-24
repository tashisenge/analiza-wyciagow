import { describe, expect, it } from "vitest";

import {
  DISCRETIONARY_INSIGHT_KIND,
  isDiscretionaryInsightPayload,
} from "@/lib/ai/discretionary-insight-types";

describe("isDiscretionaryInsightPayload", () => {
  it("returns true for discretionary insight summary", () => {
    expect(
      isDiscretionaryInsightPayload({
        insightKind: DISCRETIONARY_INSIGHT_KIND,
        periodLabel: "maj 2026",
      }),
    ).toBe(true);
  });

  it("returns false for general insight or unknown", () => {
    expect(isDiscretionaryInsightPayload({ totalExpenses: 100 })).toBe(false);
    expect(isDiscretionaryInsightPayload(null)).toBe(false);
  });
});
