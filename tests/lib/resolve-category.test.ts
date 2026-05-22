import { describe, expect, it } from "vitest";

import { resolveCategoryId } from "@/lib/categorization/resolve-category";

describe("resolveCategoryId", () => {
  const categoriesByName = new Map([
    ["Żywność i chemia domowa", "cat-food"],
    ["Wynagrodzenie", "cat-income"],
  ]);

  it("uses mbank category name 1:1 when no rule matches", () => {
    const id = resolveCategoryId(
      {
        description: "LIDL zakup",
        counterparty: "LIDL",
        mbankCategory: "Żywność i chemia domowa",
      },
      [],
      [],
      categoriesByName,
    );
    expect(id).toBe("cat-food");
  });

  it("ignores bez kategorii from mbank", () => {
    const id = resolveCategoryId(
      {
        description: "Nieznane",
        counterparty: "",
        mbankCategory: "Bez kategorii",
      },
      [],
      [],
      categoriesByName,
    );
    expect(id).toBeNull();
  });
});
