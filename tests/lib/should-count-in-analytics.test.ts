import { describe, expect, it } from "vitest";

import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

describe("shouldCountInAnalytics", () => {
  it("excludes paired own-account transfer", () => {
    expect(
      shouldCountInAnalytics(
        { transactionKey: "tx-1", category: { name: "Żywność" } },
        new Set(["tx-1"]),
      ),
    ).toBe(false);
  });

  it("excludes transfer category", () => {
    expect(
      shouldCountInAnalytics(
        {
          transactionKey: "tx-2",
          category: { name: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY },
        },
        new Set(),
      ),
    ).toBe(false);
  });

  it("includes regular expense", () => {
    expect(
      shouldCountInAnalytics(
        { transactionKey: "tx-3", category: { name: "Żywność" } },
        new Set(),
      ),
    ).toBe(true);
  });
});
