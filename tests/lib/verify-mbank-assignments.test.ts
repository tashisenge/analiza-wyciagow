import { describe, expect, it } from "vitest";

import { parseMbankVerifyResponse } from "@/lib/ai/verify-mbank-assignments";

describe("parseMbankVerifyResponse", () => {
  it("parses valid suggestions", () => {
    const raw = JSON.stringify({
      suggestions: [
        {
          id: "tx-1",
          recommendedCategory: "Żywność i chemia domowa",
          reason: "Opis wskazuje zakupy spożywcze.",
          prefer: "app",
        },
      ],
    });
    const result = parseMbankVerifyResponse(raw, new Set(["Żywność i chemia domowa"]));
    expect(result.get("tx-1")).toEqual({
      recommendedCategory: "Żywność i chemia domowa",
      reason: "Opis wskazuje zakupy spożywcze.",
      prefer: "app",
    });
  });

  it("skips unknown categories", () => {
    const raw = JSON.stringify({
      suggestions: [
        { id: "tx-1", recommendedCategory: "Nieistniejąca", reason: "x", prefer: "mbank" },
      ],
    });
    const result = parseMbankVerifyResponse(raw, new Set(["Transport"]));
    expect(result.size).toBe(0);
  });
});
