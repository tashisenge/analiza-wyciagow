import { describe, expect, it } from "vitest";

import type { ReviewQueueItem } from "@/lib/review/load-review-queue";
import { parseReviewSort, sortReviewItems } from "@/lib/review/review-sort";

function item(partial: Partial<ReviewQueueItem> & { id: string }): ReviewQueueItem {
  return {
    bookedAt: new Date("2026-01-01"),
    counterparty: "A",
    description: "",
    amount: "10.00",
    currency: "PLN",
    mbankCategory: "Żywność",
    categoryId: null,
    categoryName: null,
    ...partial,
  };
}

describe("review-sort", () => {
  it("sorts by counterparty ascending", () => {
    const rows = sortReviewItems(
      [
        item({ id: "b", counterparty: "Żabka" }),
        item({ id: "a", counterparty: "Allegro" }),
      ],
      parseReviewSort({ sort: "counterparty", sortDir: "asc" }),
    );
    expect(rows.map((row) => row.counterparty)).toEqual(["Allegro", "Żabka"]);
  });

  it("sorts by amount descending", () => {
    const rows = sortReviewItems(
      [
        item({ id: "low", amount: "5.00" }),
        item({ id: "high", amount: "99.00" }),
      ],
      parseReviewSort({ sort: "amount", sortDir: "desc" }),
    );
    expect(rows.map((row) => row.id)).toEqual(["high", "low"]);
  });
});
