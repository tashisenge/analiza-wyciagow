import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  parseAlternativesJson,
  parseSourcesJson,
  toInputJson,
} from "@/lib/research/parse-research-json";

describe("parse-research-json", () => {
  it("round-trips alternatives via toInputJson", () => {
    const alternatives = [{ name: "X", estimatedMonthlyPln: 10, note: "y" }];
    const stored = toInputJson(alternatives) as Prisma.JsonValue;
    const parsed = parseAlternativesJson(stored);
    expect(parsed[0]?.name).toBe("X");
  });

  it("parses sources json", () => {
    const sources = [{ title: "A", url: "https://a.pl" }];
    const stored = toInputJson(sources) as Prisma.JsonValue;
    expect(parseSourcesJson(stored)).toEqual(sources);
  });
});
