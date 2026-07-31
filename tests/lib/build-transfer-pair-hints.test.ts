import { describe, expect, it } from "vitest";

import { buildTransferPairHintByTransactionId } from "@/lib/transactions/build-transfer-pair-hints";

describe("buildTransferPairHintByTransactionId", () => {
  it("pairs opposite amounts on different accounts", () => {
    const hints = buildTransferPairHintByTransactionId([
      {
        id: "out",
        accountId: "a1",
        accountType: "firma",
        amount: "-1000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
      {
        id: "in",
        accountId: "a2",
        accountType: "dom",
        amount: "1000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
    ]);

    expect(hints.get("out")).toContain("dom");
    expect(hints.get("in")).toContain("firma");
  });

  it("returns empty when no matching pair", () => {
    const hints = buildTransferPairHintByTransactionId([
      {
        id: "solo",
        accountId: "a1",
        accountType: "firma",
        amount: "-100.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
    ]);
    expect(hints.size).toBe(0);
  });

  it("keeps distinct same-amount pairs from sharing one partner hint", () => {
    const hints = buildTransferPairHintByTransactionId([
      {
        id: "dom-1",
        accountId: "dom",
        accountType: "dom",
        amount: "500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
      {
        id: "firma-1",
        accountId: "firma",
        accountType: "firma",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
      {
        id: "dom-2",
        accountId: "dom",
        accountType: "dom",
        amount: "500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-22"),
      },
      {
        id: "firma-2",
        accountId: "firma",
        accountType: "firma",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-22"),
      },
    ]);

    expect(hints.get("dom-1")).toContain("2026-05-20");
    expect(hints.get("firma-1")).toContain("2026-05-20");
    expect(hints.get("dom-2")).toContain("2026-05-22");
    expect(hints.get("firma-2")).toContain("2026-05-22");
  });
});
