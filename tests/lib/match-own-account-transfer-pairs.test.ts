import { describe, expect, it } from "vitest";

import { buildPairedOwnAccountTransferKeys } from "@/lib/transactions/match-own-account-transfer-pairs";

describe("buildPairedOwnAccountTransferKeys", () => {
  it("pairs opposite amounts on different accounts", () => {
    const paired = buildPairedOwnAccountTransferKeys([
      {
        key: "out",
        accountId: "a1",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
      {
        key: "in",
        accountId: "a2",
        amount: "500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
    ]);
    expect(paired.has("out")).toBe(true);
    expect(paired.has("in")).toBe(true);
  });

  it("does not pair by description alone on one account", () => {
    const paired = buildPairedOwnAccountTransferKeys([
      {
        key: "only",
        accountId: "a1",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
    ]);
    expect(paired.has("only")).toBe(false);
  });

  it("does not pair same-direction amounts", () => {
    const paired = buildPairedOwnAccountTransferKeys([
      {
        key: "a",
        accountId: "a1",
        amount: "-100.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
      {
        key: "b",
        accountId: "a2",
        amount: "-100.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
    ]);
    expect(paired.size).toBe(0);
  });
});
