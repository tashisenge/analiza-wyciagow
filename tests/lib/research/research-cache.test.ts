import { describe, expect, it } from "vitest";

import { isResearchCacheFresh } from "@/lib/research/research-cache";

describe("isResearchCacheFresh", () => {
  it("returns true within 30 days", () => {
    const now = new Date("2026-05-22");
    const researchedAt = new Date("2026-05-01");
    expect(isResearchCacheFresh(researchedAt, now)).toBe(true);
  });

  it("returns false after 30 days", () => {
    const now = new Date("2026-06-22");
    const researchedAt = new Date("2026-05-01");
    expect(isResearchCacheFresh(researchedAt, now)).toBe(false);
  });
});
