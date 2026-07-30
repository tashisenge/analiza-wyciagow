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
    expect(paired.pairedImportKeys.size).toBe(1);
    expect(paired.existingPartnerHashes.has("existing-firma")).toBe(true);
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
    expect(paired.pairedImportKeys.size).toBe(0);
    expect(paired.existingPartnerHashes.size).toBe(0);
  });

  it("exposes existing partner hashes for sequential account imports", () => {
    const bookedAt = new Date("2026-05-21");
    const paired = buildImportPairedTransferKeys(
      "acc-firma",
      [
        {
          bookedAt,
          amount: "-1900.00",
          currency: "PLN",
          description: "Przelew własne",
          counterparty: "Ja",
          mbankCategory: "Przelewy",
          accountLabel: "firma",
        },
      ],
      [
        {
          dedupeHash: "dom-in-first-import",
          accountId: "acc-dom",
          amount: "1900.00",
          currency: "PLN",
          bookedAt,
        },
      ],
    );

    expect([...paired.pairedImportKeys]).toHaveLength(1);
    expect([...paired.existingPartnerHashes]).toEqual(["dom-in-first-import"]);
  });
});
