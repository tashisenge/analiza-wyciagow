import { describe, expect, it } from "vitest";

import type { MappedDiscretionaryTx } from "@/lib/discretionary/aggregate-discretionary-merchants";
import { computeDiscretionaryByPerson } from "@/lib/discretionary/compute-discretionary-by-person";

function makeTx(
  amount: string,
  tagNames: string[],
  isDiscretionary: boolean,
): MappedDiscretionaryTx {
  return {
    amount,
    counterparty: "Shop",
    tagNames,
    category: { isDiscretionary, name: "Rozrywka" },
    countsInAnalytics: true,
  };
}

describe("computeDiscretionaryByPerson", () => {
  it("groups discretionary spending by person tag", () => {
    const rows = computeDiscretionaryByPerson([
      makeTx("-100", ["Adam"], true),
      makeTx("-50", ["Żona"], true),
      makeTx("-25", [], true),
      makeTx("-200", ["Adam"], false),
    ]);

    expect(rows).toEqual([
      {
        name: "Adam",
        totalPln: 100,
        transactionCount: 1,
        shareOfDiscretionaryPercent: 57.1,
      },
      {
        name: "Żona",
        totalPln: 50,
        transactionCount: 1,
        shareOfDiscretionaryPercent: 28.6,
      },
      {
        name: "Bez tagu",
        totalPln: 25,
        transactionCount: 1,
        shareOfDiscretionaryPercent: 14.3,
      },
    ]);
  });
});
