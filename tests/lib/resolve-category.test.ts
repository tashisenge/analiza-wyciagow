import { describe, expect, it } from "vitest";

import { resolveCategoryId } from "@/lib/categorization/resolve-category";
import { shouldExcludeCategoryFromOptimization } from "@/lib/categories/canonical-categories";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

describe("resolveCategoryId", () => {
  const categoriesByName = new Map([
    ["Żywność", "cat-food"],
    ["Przychód", "cat-income"],
    [TRANSFER_BETWEEN_ACCOUNTS_CATEGORY, "cat-transfer"],
    ["Podatki (firma)", "cat-tax"],
  ]);

  it("maps mbank category to canonical app category", () => {
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

  it("maps tax-related mbank labels to Podatki (firma)", () => {
    const id = resolveCategoryId(
      {
        description: "PIT",
        counterparty: "Urząd Skarbowy",
        mbankCategory: "Podatki",
      },
      [],
      [],
      categoriesByName,
    );
    expect(id).toBe("cat-tax");
  });

  it("uses transfer category only when paired own-account flag is set", () => {
    const withPair = resolveCategoryId(
      {
        description: "Jan, PRZELEW WEWNĘTRZNY",
        counterparty: "Jan",
        isPairedOwnAccountTransfer: true,
      },
      [],
      [],
      categoriesByName,
    );
    expect(withPair).toBe("cat-transfer");

    const withoutPair = resolveCategoryId(
      {
        description: "Jan, PRZELEW WEWNĘTRZNY",
        counterparty: "Jan",
        isPairedOwnAccountTransfer: false,
      },
      [],
      [],
      categoriesByName,
    );
    expect(withoutPair).toBeNull();
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

describe("shouldExcludeCategoryFromOptimization", () => {
  it("excludes fixed expense categories", () => {
    expect(
      shouldExcludeCategoryFromOptimization({
        name: "Podatki (firma)",
        excludeFromOptimization: true,
      }),
    ).toBe(true);
    expect(
      shouldExcludeCategoryFromOptimization({
        name: "Żywność",
        excludeFromOptimization: false,
      }),
    ).toBe(false);
  });
});
