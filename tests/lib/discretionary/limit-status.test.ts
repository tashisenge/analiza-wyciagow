import { describe, expect, it } from "vitest";

import {
  discretionaryLimitApproachingMessage,
  discretionaryLimitOverrunMessage,
  isDiscretionaryLimitApproaching,
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

describe("isDiscretionaryLimitApproaching", () => {
  it("returns true between 80% and 100%", () => {
    expect(isDiscretionaryLimitApproaching(80)).toBe(true);
    expect(isDiscretionaryLimitApproaching(95)).toBe(true);
    expect(isDiscretionaryLimitApproaching(100)).toBe(true);
  });

  it("returns false below 80% or above 100%", () => {
    expect(isDiscretionaryLimitApproaching(79.9)).toBe(false);
    expect(isDiscretionaryLimitApproaching(100.1)).toBe(false);
    expect(isDiscretionaryLimitApproaching(null)).toBe(false);
  });
});

describe("discretionaryLimitOverrunMessage", () => {
  it("includes overrun amount", () => {
    const message = discretionaryLimitOverrunMessage(120, 1000, 1200);
    expect(message).toContain("200.00");
    expect(message).toContain("120.0%");
  });
});

describe("discretionaryLimitApproachingMessage", () => {
  it("includes remaining amount", () => {
    const message = discretionaryLimitApproachingMessage(85, 1000, 850);
    expect(message).toContain("150.00");
    expect(message).toContain("85.0%");
  });
});
