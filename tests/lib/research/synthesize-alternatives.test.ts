import { describe, expect, it } from "vitest";

import { parseAlternativesResponse } from "@/lib/ai/synthesize-alternatives";

describe("parseAlternativesResponse", () => {
  it("parses valid JSON", () => {
    const raw = JSON.stringify({
      summaryMarkdown: "Możesz rozważyć tańszy plan.",
      alternatives: [
        { name: "Spotify Duo", estimatedMonthlyPln: 24.99, note: "dla 2 osób" },
      ],
    });
    const parsed = parseAlternativesResponse(raw);
    expect(parsed.summaryMarkdown).toContain("tańszy");
    expect(parsed.alternatives).toHaveLength(1);
    expect(parsed.alternatives[0]?.estimatedMonthlyPln).toBe(24.99);
  });

  it("extracts JSON from markdown wrapper", () => {
    const raw = '```json\n{"summaryMarkdown":"x","alternatives":[]}\n```';
    const parsed = parseAlternativesResponse(raw);
    expect(parsed.summaryMarkdown).toBe("x");
  });
});
