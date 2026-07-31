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

  it("pairs each partner at most once when multiple same-amount candidates exist", () => {
    const paired = buildPairedOwnAccountTransferKeys([
      {
        key: "dom-transfer",
        accountId: "dom",
        amount: "2000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
      {
        key: "dom-salary",
        accountId: "dom",
        amount: "2000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-21"),
      },
      {
        key: "firma-out",
        accountId: "firma",
        amount: "-2000.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
    ]);

    expect(paired.has("dom-transfer")).toBe(true);
    expect(paired.has("firma-out")).toBe(true);
    expect(paired.has("dom-salary")).toBe(false);
    expect(paired.size).toBe(2);
  });

  it("pairs two distinct 1:1 transfers with the same absolute amount", () => {
    const paired = buildPairedOwnAccountTransferKeys([
      {
        key: "dom-1",
        accountId: "dom",
        amount: "500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
      {
        key: "firma-1",
        accountId: "firma",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-20"),
      },
      {
        key: "dom-2",
        accountId: "dom",
        amount: "500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-22"),
      },
      {
        key: "firma-2",
        accountId: "firma",
        amount: "-500.00",
        currency: "PLN",
        bookedAt: new Date("2026-05-22"),
      },
    ]);

    expect(paired.size).toBe(4);
    expect(paired.has("dom-1")).toBe(true);
    expect(paired.has("firma-1")).toBe(true);
    expect(paired.has("dom-2")).toBe(true);
    expect(paired.has("firma-2")).toBe(true);
  });
});
