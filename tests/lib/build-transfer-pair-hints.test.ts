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
        description: "Adam, PRZELEW WEWNĘTRZNY WYSYŁANY",
      },
      {
        id: "in",
        accountId: "a2",
        accountType: "dom",
        amount: "1000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
        description: "Adam, PRZELEW WEWNĘTRZNY PRZYCHODZĄCY",
      },
    ]);

    expect(hints.get("out")).toContain("dom");
    expect(hints.get("in")).toContain("firma");
  });
});
