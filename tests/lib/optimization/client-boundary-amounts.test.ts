import { describe, expect, it } from "vitest";

import { mapBudgetRowsForClient } from "@/lib/optimization/load-budget-spent";
import type { OpportunityWithRelations } from "@/lib/optimization/load-optimization-data";
import { mapOpportunitiesForCards } from "@/lib/optimization/map-opportunity-cards";

class DecimalLike {
  constructor(private readonly raw: string) {}

  toString(): string {
    return this.raw;
  }
}

describe("optimize client boundary amounts", () => {
  it("turns opportunity savings into strings", () => {
    const cards = mapOpportunitiesForCards([
      {
        id: "opp-1",
        type: "RECURRING",
        title: "Powtarzalne: Netflix",
        description: "3 podobnych transakcji",
        estimatedMonthlySavings: new DecimalLike("19.99"),
        counterparty: "Netflix",
        categoryId: null,
        savingsVerified: false,
        research: null,
      } as unknown as OpportunityWithRelations,
    ]);

    expect(cards[0]?.estimatedMonthlySavings).toBe("19.99");
    expect(typeof cards[0]?.estimatedMonthlySavings).toBe("string");
  });

  it("keeps a missing savings estimate null", () => {
    const cards = mapOpportunitiesForCards([
      {
        id: "opp-2",
        type: "ANOMALY",
        title: "Wpadka",
        description: "Jednorazowy wydatek",
        estimatedMonthlySavings: null,
        counterparty: null,
        categoryId: null,
        savingsVerified: false,
        research: null,
      } as unknown as OpportunityWithRelations,
    ]);

    expect(cards[0]?.estimatedMonthlySavings).toBeNull();
  });

  it("turns budget limits into strings", () => {
    const rows = mapBudgetRowsForClient([
      {
        spent: 40,
        budget: {
          id: "budget-1",
          categoryId: "cat-1",
          monthlyLimit: new DecimalLike("200.00"),
          category: { name: "Rozrywka" },
        },
      },
    ]);

    expect(rows[0]?.budget.monthlyLimit).toBe("200.00");
    expect(rows[0]?.budget.category.name).toBe("Rozrywka");
    expect(rows[0]?.spent).toBe(40);
  });
});
