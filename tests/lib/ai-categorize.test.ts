import { describe, expect, it } from "vitest";

import { parseCategorizationResponse } from "@/lib/ai/categorize-batch";

describe("parseCategorizationResponse", () => {
  it("parses valid JSON from model response", () => {
    const raw = `Oto wynik:
{"assignments":[{"id":"tx1","category":"Żywność"},{"id":"tx2","category":"Transport"}]}`;
    const valid = new Set(["Żywność", "Transport", "Inne"]);
    const map = parseCategorizationResponse(raw, valid);
    expect(map.get("tx1")).toBe("Żywność");
    expect(map.get("tx2")).toBe("Transport");
  });

  it("ignores invalid category names", () => {
    const raw = `{"assignments":[{"id":"tx1","category":"Hack"}]}`;
    const map = parseCategorizationResponse(raw, new Set(["Żywność"]));
    expect(map.size).toBe(0);
  });
});
