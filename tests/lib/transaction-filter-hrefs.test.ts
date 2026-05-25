import { describe, expect, it } from "vitest";

import {
  buildTransactionCategoryFilterHref,
  buildTransactionQuickFilterHref,
  buildTransactionTagFilterHref,
} from "@/lib/transactions/transaction-filter-hrefs";

const baseParams = {
  context: "dom" as const,
  dateFrom: "2026-01-01",
  categoryId: "cat-old",
  tagId: "tag-old",
  discretionary: "1" as const,
  uncategorized: "1" as const,
};

describe("buildTransactionQuickFilterHref", () => {
  it("returns plain path for all", () => {
    expect(buildTransactionQuickFilterHref("all", baseParams)).toBe("/transactions");
  });

  it("clears category and tag when switching to firma", () => {
    const href = buildTransactionQuickFilterHref("firma", baseParams);
    expect(href).toContain("context=firma");
    expect(href).not.toContain("categoryId=");
    expect(href).not.toContain("tagId=");
    expect(href).not.toContain("uncategorized=");
    expect(href).not.toContain("discretionary=");
    expect(href).toContain("dateFrom=2026-01-01");
  });

  it("clears category and tag when switching to dom", () => {
    const href = buildTransactionQuickFilterHref("dom", baseParams);
    expect(href).toContain("context=dom");
    expect(href).not.toContain("categoryId=");
    expect(href).not.toContain("tagId=");
  });

  it("sets uncategorized and clears conflicting filters", () => {
    const href = buildTransactionQuickFilterHref("uncategorized", { context: "firma" });
    expect(href).toContain("uncategorized=1");
    expect(href).toContain("context=firma");
    expect(href).not.toContain("categoryId=");
    expect(href).not.toContain("tagId=");
  });
});

describe("buildTransactionCategoryFilterHref", () => {
  it("sets category and clears uncategorized and discretionary", () => {
    const href = buildTransactionCategoryFilterHref(
      { uncategorized: "1", discretionary: "1", context: "dom" },
      "cat-new",
    );
    expect(href).toContain("categoryId=cat-new");
    expect(href).toContain("context=dom");
    expect(href).not.toContain("uncategorized=");
    expect(href).not.toContain("discretionary=");
  });

  it("clears category filter when empty id", () => {
    const href = buildTransactionCategoryFilterHref(
      { categoryId: "cat-old", context: "firma" },
      "",
    );
    expect(href).not.toContain("categoryId=");
    expect(href).toContain("context=firma");
  });
});

describe("buildTransactionTagFilterHref", () => {
  it("sets tag and clears category filters", () => {
    const href = buildTransactionTagFilterHref(
      { categoryId: "cat-old", uncategorized: "1" },
      "tag-new",
    );
    expect(href).toContain("tagId=tag-new");
    expect(href).not.toContain("categoryId=");
    expect(href).not.toContain("uncategorized=");
  });
});
