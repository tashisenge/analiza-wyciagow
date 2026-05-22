import { describe, expect, it } from "vitest";

import { buildTransactionDedupeHash } from "@/lib/transaction-hash";

describe("buildTransactionDedupeHash", () => {
  it("returns stable hash for same inputs", () => {
    const input = {
      bookedAt: new Date("2025-03-01"),
      amount: "-49.99",
      description: "Zakup BLIK",
      accountId: "acc_1",
    };
    expect(buildTransactionDedupeHash(input)).toBe(buildTransactionDedupeHash(input));
  });

  it("differs when amount changes", () => {
    const base = {
      bookedAt: new Date("2025-03-01"),
      amount: "-49.99",
      description: "Zakup BLIK",
      accountId: "acc_1",
    };
    expect(buildTransactionDedupeHash(base)).not.toBe(
      buildTransactionDedupeHash({ ...base, amount: "-50.00" }),
    );
  });
});
