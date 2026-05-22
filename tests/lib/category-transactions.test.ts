import { describe, expect, it } from "vitest";

import { groupExpensesByCategory } from "@/lib/analytics/category-transactions";

describe("groupExpensesByCategory", () => {
  it("groups expenses and limits preview rows", () => {
    const groups = groupExpensesByCategory(
      [
        {
          id: "1",
          amount: "-10",
          bookedAt: new Date("2026-05-01"),
          counterparty: "LIDL",
          description: "zakupy",
          categoryId: "cat-a",
          categoryName: "Żywność",
        },
        {
          id: "2",
          amount: "-20",
          bookedAt: new Date("2026-05-02"),
          counterparty: "Biedronka",
          description: "zakupy",
          categoryId: "cat-a",
          categoryName: "Żywność",
        },
        {
          id: "3",
          amount: "100",
          bookedAt: new Date("2026-05-03"),
          counterparty: "Firma",
          description: "wpływ",
          categoryId: null,
          categoryName: "Przychód",
        },
      ],
      5,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.categoryName).toBe("Żywność");
    expect(groups[0]?.total).toBe(30);
    expect(groups[0]?.transactions).toHaveLength(2);
  });
});
