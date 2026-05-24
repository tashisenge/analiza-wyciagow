import { describe, expect, it } from "vitest";

import {
  buildTransactionsReturnTo,
  prismaCategoryFilter,
  transactionActiveFilter,
} from "@/lib/transactions/page-filters";

describe("page-filters", () => {
  it("builds return URL with counterparty", () => {
    const url = buildTransactionsReturnTo({
      context: "dom",
      counterparty: "NETFLIX",
    });
    expect(url).toContain("counterparty=NETFLIX");
    expect(url).toContain("context=dom");
  });

  it("filters by category id", () => {
    const filter = prismaCategoryFilter({ categoryId: "c1" }, "ws1");
    expect(filter).toEqual({ categoryId: "c1" });
  });

  it("detects active filter for uncategorized", () => {
    expect(transactionActiveFilter({ uncategorized: "1" })).toBe("uncategorized");
  });

  it("builds return URL with date range", () => {
    const url = buildTransactionsReturnTo({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    });
    expect(url).toContain("dateFrom=2026-01-01");
    expect(url).toContain("dateTo=2026-01-31");
  });
});
