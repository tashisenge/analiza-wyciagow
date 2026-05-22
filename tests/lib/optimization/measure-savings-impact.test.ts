import { describe, expect, it } from "vitest";

import { measureSavingsImpact } from "@/lib/optimization/measure-savings-impact";

describe("measureSavingsImpact", () => {
  it("returns true when spend dropped more than 10%", () => {
    const before = [
      {
        id: "1",
        bookedAt: new Date(),
        amount: "-100",
        counterparty: "NETFLIX",
        categoryId: null,
        categoryName: "",
      },
      {
        id: "2",
        bookedAt: new Date(),
        amount: "-100",
        counterparty: "NETFLIX",
        categoryId: null,
        categoryName: "",
      },
    ];
    const after = [
      {
        id: "3",
        bookedAt: new Date(),
        amount: "-50",
        counterparty: "NETFLIX",
        categoryId: null,
        categoryName: "",
      },
    ];
    expect(measureSavingsImpact("NETFLIX", before, after)).toBe(true);
  });
});
