import { describe, expect, it } from "vitest";

import {
  mapMbankCategoryToAppName,
  normalizeMbankCategoryName,
} from "@/lib/mbank-category-map";

describe("normalizeMbankCategoryName", () => {
  it("keeps mbank label as-is", () => {
    expect(normalizeMbankCategoryName("Żywność i chemia domowa")).toBe(
      "Żywność i chemia domowa",
    );
  });

  it("returns null for bez kategorii", () => {
    expect(normalizeMbankCategoryName("Bez kategorii")).toBeNull();
  });
});

describe("mapMbankCategoryToAppName", () => {
  it("passes through mbank name (1:1)", () => {
    expect(mapMbankCategoryToAppName("Wynagrodzenie")).toBe("Wynagrodzenie");
  });
});
