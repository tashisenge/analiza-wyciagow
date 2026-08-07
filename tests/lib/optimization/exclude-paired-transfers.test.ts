import { describe, expect, it } from "vitest";

import { detectRecurring } from "@/lib/optimization/detect-recurring";
import { excludePairedOwnAccountTransfers } from "@/lib/optimization/exclude-paired-transfers";
import { mapTransactionsForOptimization } from "@/lib/optimization/map-transactions";

describe("excludePairedOwnAccountTransfers", () => {
  it("removes opposite-sign same-amount legs across accounts", () => {
    const txs = [
      {
        id: "out-1",
        accountId: "dom",
        amount: "-3000.00",
        currency: "PLN",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "in-1",
        accountId: "firma",
        amount: "3000.00",
        currency: "PLN",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "netflix",
        accountId: "dom",
        amount: "-49.99",
        currency: "PLN",
        bookedAt: new Date("2026-01-06"),
      },
    ];

    const kept = excludePairedOwnAccountTransfers(txs).map((tx) => tx.id);
    expect(kept).toEqual(["netflix"]);
  });

  it("keeps unpaired expenses that look like transfers but have no partner", () => {
    const txs = [
      {
        id: "lonely",
        accountId: "dom",
        amount: "-3000.00",
        currency: "PLN",
        bookedAt: new Date("2026-01-05"),
      },
    ];
    expect(excludePairedOwnAccountTransfers(txs)).toHaveLength(1);
  });

  it("stops monthly own-account transfers from becoming recurring opportunities", () => {
    const raw = [0, 1, 2].flatMap((offset) => {
      const bookedAt = new Date(2026, offset, 5);
      return [
        {
          id: `out-${String(offset)}`,
          accountId: "dom",
          amount: "-5000.00",
          currency: "PLN",
          bookedAt,
          categoryId: null,
          category: null,
          mbankCategory: "",
          counterparty: "PRZELEW WLASNY",
        },
        {
          id: `in-${String(offset)}`,
          accountId: "oszczednosci",
          amount: "5000.00",
          currency: "PLN",
          bookedAt,
          categoryId: null,
          category: null,
          mbankCategory: "",
          counterparty: "PRZELEW WLASNY",
        },
      ];
    });

    const withoutFilter = detectRecurring(
      mapTransactionsForOptimization(raw),
      { minOccurrences: 3, amountTolerancePercent: 5 },
      new Date("2026-03-15"),
    );
    expect(withoutFilter).toHaveLength(1);
    expect(withoutFilter[0]?.estimatedMonthlySavings).toBe(5000);

    const filtered = excludePairedOwnAccountTransfers(raw);
    const withFilter = detectRecurring(
      mapTransactionsForOptimization(filtered),
      { minOccurrences: 3, amountTolerancePercent: 5 },
      new Date("2026-03-15"),
    );
    expect(withFilter).toHaveLength(0);
  });
});
