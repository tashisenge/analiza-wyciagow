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
});
