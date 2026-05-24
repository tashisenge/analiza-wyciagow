import { describe, expect, it } from "vitest";

import {
  discretionaryLimitOverrunMessage,
  isDiscretionaryLimitOverrun,
} from "@/lib/discretionary/limit-status";

describe("isDiscretionaryLimitOverrun", () => {
  it("returns true above 100%", () => {
    expect(isDiscretionaryLimitOverrun(105)).toBe(true);
  });

  it("returns false at or below 100%", () => {
    expect(isDiscretionaryLimitOverrun(100)).toBe(false);
    expect(isDiscretionaryLimitOverrun(null)).toBe(false);
  });
});

describe("discretionaryLimitOverrunMessage", () => {
  it("includes overrun amount", () => {
    const message = discretionaryLimitOverrunMessage(120, 1000, 1200);
    expect(message).toContain("200.00");
    expect(message).toContain("120.0%");
  });
});
