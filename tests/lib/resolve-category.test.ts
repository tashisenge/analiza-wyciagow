import { describe, expect, it } from "vitest";

import { resolveCategoryId } from "@/lib/categorization/resolve-category";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

describe("resolveCategoryId", () => {
  const categoriesByName = new Map([
    ["Żywność i chemia domowa", "cat-food"],
    ["Wynagrodzenie", "cat-income"],
    [TRANSFER_BETWEEN_ACCOUNTS_CATEGORY, "cat-transfer"],
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
