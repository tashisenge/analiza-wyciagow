import { describe, expect, it } from "vitest";

import { isResearchEligible } from "@/lib/research/is-research-eligible";

describe("isResearchEligible", () => {
  it("allows subscription with counterparty", () => {
    expect(isResearchEligible("SUBSCRIPTION", "NETFLIX")).toBe(true);
  });

  it("rejects anomaly", () => {
    expect(isResearchEligible("ANOMALY", "SHOP")).toBe(false);
  });

  it("rejects empty counterparty", () => {
    expect(isResearchEligible("RECURRING", "")).toBe(false);
  });
});
