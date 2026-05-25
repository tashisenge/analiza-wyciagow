import { describe, expect, it } from "vitest";

import { needsMbankReview } from "@/lib/review/needs-mbank-review";

describe("needsMbankReview", () => {
  it("true when mbank is bez kategorii", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Bez kategorii",
        categoryId: "c1",
        categoryName: "Żywność",
      }),
    ).toBe(true);
  });

  it("true when app category differs from mbank", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: "c1",
        categoryName: "Paliwo",
      }),
    ).toBe(true);
  });

  it("true when mbank has category but app has none", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: null,
        categoryName: null,
      }),
    ).toBe(true);
  });

  it("false when names match", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: "c1",
        categoryName: "Transport",
      }),
    ).toBe(false);
  });

  it("false when review was already resolved", () => {
    expect(
      needsMbankReview({
        mbankCategory: "Transport",
        categoryId: "c1",
        categoryName: "Paliwo",
        mbankReviewResolvedAt: new Date(),
      }),
    ).toBe(false);
  });

  it("false when both empty mbank and no app category", () => {
    expect(
      needsMbankReview({
        mbankCategory: "",
        categoryId: null,
        categoryName: null,
      }),
    ).toBe(false);
  });
});
