import { describe, expect, it } from "vitest";

import { buildSearchQuery } from "@/lib/research/build-search-query";

describe("buildSearchQuery", () => {
  it("builds Polish savings query", () => {
    expect(buildSearchQuery("SPOTIFY")).toContain("Spotify");
    expect(buildSearchQuery("SPOTIFY")).toContain("tańsza alternatywa");
    expect(buildSearchQuery("SPOTIFY")).toContain("Polska");
  });
});
