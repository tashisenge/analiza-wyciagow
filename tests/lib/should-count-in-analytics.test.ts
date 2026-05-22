import { describe, expect, it } from "vitest";

import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

describe("shouldCountInAnalytics", () => {
  it("excludes transfer category", () => {
    expect(
      shouldCountInAnalytics({
        description: "Sklep",
        category: { name: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY },
      }),
    ).toBe(false);
  });

  it("excludes internal transfer by description", () => {
    expect(
      shouldCountInAnalytics({
        description: "X, PRZELEW WEWNĘTRZNY PRZYCHODZĄCY",
      }),
    ).toBe(false);
  });

  it("includes regular expense", () => {
    expect(
      shouldCountInAnalytics({
        description: "NETTO ZAKUP PRZY UŻYCIU KARTY",
        category: { name: "Żywność" },
      }),
    ).toBe(true);
  });
});
