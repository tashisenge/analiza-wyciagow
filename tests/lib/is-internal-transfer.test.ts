import { describe, expect, it } from "vitest";

import { isInternalTransfer } from "@/lib/transactions/is-internal-transfer";

describe("isInternalTransfer", () => {
  it("detects przelew wewnętrzny", () => {
    expect(
      isInternalTransfer({
        description: "KLIENT TESTOWY, PRZELEW WEWNĘTRZNY PRZYCHODZĄCY",
      }),
    ).toBe(true);
  });

  it("detects przelew własny", () => {
    expect(
      isInternalTransfer({
        description: "Jan Kowalski, PRZELEW WŁASNY",
      }),
    ).toBe(true);
  });

  it("returns false for card purchase", () => {
    expect(
      isInternalTransfer({
        description: "NETTO ZAKUP PRZY UŻYCIU KARTY W KRAJU",
      }),
    ).toBe(false);
  });
});
