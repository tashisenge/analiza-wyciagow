import { describe, expect, it } from "vitest";

import {
  buildTransactionsReturnTo,
  parseTransactionSearchParams,
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

  it("ignores empty category id", () => {
    expect(prismaCategoryFilter({ categoryId: "" }, "ws1")).toEqual({});
    expect(prismaCategoryFilter({ categoryId: "   " }, "ws1")).toEqual({});
  });

  it("skips category filter when uncategorized is active", () => {
    expect(prismaCategoryFilter({ uncategorized: "1", categoryId: "c1" }, "ws1")).toEqual(
      {},
    );
  });

  it("detects active filter for uncategorized", () => {
    expect(transactionActiveFilter({ uncategorized: "1" })).toBe("uncategorized");
  });

  it("detects active filter for category id", () => {
    expect(transactionActiveFilter({ categoryId: "cat-1" })).toBe("category");
  });

  it("detects active filter for category name", () => {
    expect(transactionActiveFilter({ categoryName: "Żywność" })).toBe("category");
  });

  it("builds return URL with date range", () => {
    const url = buildTransactionsReturnTo({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
    });
    expect(url).toContain("dateFrom=2026-01-01");
    expect(url).toContain("dateTo=2026-01-31");
  });

  it("parses Next.js searchParams arrays and trims values", () => {
    expect(
      parseTransactionSearchParams({
        categoryId: ["cat-1", "ignored"],
        context: "  dom  ",
        counterparty: "",
      }),
    ).toEqual({
      uncategorized: undefined,
      discretionary: undefined,
      context: "dom",
      categoryId: "cat-1",
      categoryName: undefined,
      counterparty: undefined,
      tagId: undefined,
      mbankCategory: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: undefined,
      sortDir: undefined,
      cursor: undefined,
      msg: undefined,
      error: undefined,
    });
  });

  it("parses sort params", () => {
    expect(parseTransactionSearchParams({ sort: "name", sortDir: "asc" })).toMatchObject({
      sort: "name",
      sortDir: "asc",
    });
  });

  it("parses cursor param", () => {
    expect(parseTransactionSearchParams({ cursor: "off:50" })).toMatchObject({
      cursor: "off:50",
    });
  });
});

describe("buildTransactionsHref", () => {
  it("sets category while preserving context", async () => {
    const { buildTransactionsHref } =
      await import("@/lib/transactions/build-transactions-url");
    const href = buildTransactionsHref(
      { context: "dom", dateFrom: "2026-01-01" },
      { categoryId: "cat-1" },
    );
    expect(href).toContain("context=dom");
    expect(href).toContain("dateFrom=2026-01-01");
    expect(href).toContain("categoryId=cat-1");
  });

  it("clears category when patch omits it", async () => {
    const { buildTransactionsHref } =
      await import("@/lib/transactions/build-transactions-url");
    const href = buildTransactionsHref(
      { categoryId: "cat-1", context: "firma" },
      { categoryId: undefined },
    );
    expect(href).not.toContain("categoryId=");
    expect(href).toContain("context=firma");
  });

  it("preserves sort params", async () => {
    const { buildTransactionsHref } =
      await import("@/lib/transactions/build-transactions-url");
    const href = buildTransactionsHref(
      { sort: "similar", sortDir: "desc", context: "dom" },
      { counterparty: "lidl" },
    );
    expect(href).toContain("sort=similar");
    expect(href).toContain("sortDir=desc");
    expect(href).toContain("counterparty=lidl");
  });
});
