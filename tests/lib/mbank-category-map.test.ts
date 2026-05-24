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
  it("maps common mbank labels to canonical categories", () => {
    expect(mapMbankCategoryToAppName("Żywność i chemia domowa")).toBe("Żywność");
    expect(mapMbankCategoryToAppName("Przejazdy")).toBe("Transport");
    expect(mapMbankCategoryToAppName("Wynagrodzenie")).toBe("Przychód");
    expect(mapMbankCategoryToAppName("Podatki")).toBe("Podatki (firma)");
    expect(mapMbankCategoryToAppName("Składki ZUS")).toBe("ZUS (firma)");
  });

  it("falls back to Inne for unknown labels", () => {
    expect(mapMbankCategoryToAppName("Nietypowa kategoria XYZ")).toBe("Inne");
  });
});
