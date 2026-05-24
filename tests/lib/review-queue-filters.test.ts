import { describe, expect, it } from "vitest";

import { buildReviewQueueWhere } from "@/lib/review/build-review-queue-where";
import {
  getReviewReason,
  parseReviewQueueFilters,
} from "@/lib/review/review-queue-filters";

describe("buildReviewQueueWhere", () => {
  it("combines review criteria with account scope", () => {
    const where = buildReviewQueueWhere("ws-1", ["acc-a"]);
    const clauses = Array.isArray(where.AND) ? where.AND : [where.AND];
    expect(clauses).toHaveLength(2);
    expect(clauses[1]).toEqual({
      workspaceId: "ws-1",
      accountId: { in: ["acc-a"] },
    });
  });

  it("adds counterparty filter from bulk category builder", () => {
    const where = buildReviewQueueWhere("ws-1", ["acc-a"], {
      counterpartyContains: "lidl",
    });
    const clauses = Array.isArray(where.AND) ? where.AND : [where.AND];
    expect(clauses[1]).toMatchObject({
      counterparty: { contains: "lidl", mode: "insensitive" },
    });
  });
});

describe("parseReviewQueueFilters", () => {
  it("parses review search params", () => {
    expect(
      parseReviewQueueFilters({
        context: "firma",
        counterparty: "Biedronka",
        reason: "app_missing",
        uncategorized: "1",
        dateFrom: "2026-01-01",
      }),
    ).toEqual({
      context: "firma",
      counterpartyContains: "Biedronka",
      reason: "app_missing",
      uncategorizedOnly: true,
      dateFrom: "2026-01-01",
    });
  });
});

describe("getReviewReason", () => {
  it("detects mbank uncategorized", () => {
    expect(
      getReviewReason({
        mbankCategory: "Bez kategorii",
        categoryId: "cat-1",
        categoryName: "Transport",
      }),
    ).toBe("mbank_uncategorized");
  });

  it("detects missing app category", () => {
    expect(
      getReviewReason({
        mbankCategory: "Żywność i chemia domowa",
        categoryId: null,
        categoryName: null,
      }),
    ).toBe("app_missing");
  });

  it("detects name mismatch", () => {
    expect(
      getReviewReason({
        mbankCategory: "Transport",
        categoryId: "cat-1",
        categoryName: "Samochód",
      }),
    ).toBe("name_mismatch");
  });
});
