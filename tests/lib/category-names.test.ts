import { describe, expect, it } from "vitest";

import { uniqueMbankCategoryNames } from "@/lib/mbank/category-names";

describe("uniqueMbankCategoryNames", () => {
  it("deduplicates and skips bez kategorii", () => {
    const names = uniqueMbankCategoryNames(["Paliwo", "Bez kategorii", "Paliwo", "  "]);
    expect(names).toEqual(["Paliwo"]);
  });
});
