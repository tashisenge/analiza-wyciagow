import { describe, expect, it } from "vitest";

import { buildImportPairedTransferKeys } from "@/lib/import/build-import-transfer-pairs";

describe("buildImportPairedTransferKeys", () => {
  it("marks import row when opposite exists on other account", () => {
    const bookedAt = new Date("2026-05-21");
    const paired = buildImportPairedTransferKeys(
      "acc-dom",
      [
        {
          bookedAt,
          amount: "500.00",
          currency: "PLN",
          description: "Przelew",
          counterparty: "Ja",
          mbankCategory: "",
          accountLabel: "dom",
        },
      ],
      [
        {
          dedupeHash: "existing-firma",
          accountId: "acc-firma",
          amount: "-500.00",
          currency: "PLN",
          bookedAt,
        },
      ],
    );
    expect(paired.size).toBe(1);
  });

  it("returns empty when no pair in workspace", () => {
    const paired = buildImportPairedTransferKeys(
      "acc-dom",
      [
        {
          bookedAt: new Date("2026-05-21"),
          amount: "-100.00",
          currency: "PLN",
          description: "Sklep",
          counterparty: "LIDL",
          mbankCategory: "",
          accountLabel: "dom",
        },
      ],
      [],
    );
    expect(paired.size).toBe(0);
  });
});
