import { describe, expect, it } from "vitest";

import { normalizeMerchant } from "@/lib/research/normalize-merchant";

describe("normalizeMerchant", () => {
  it("maps Netflix keyword", () => {
    expect(normalizeMerchant("NETFLIX ZAKUP PRZY UŻYCIU KARTY")).toBe("Netflix");
  });

  it("strips card noise and keeps first token", () => {
    expect(normalizeMerchant("BOLT  ZAKUP PRZY UŻYCIU KARTY")).toBe("Bolt");
  });

  it("returns trimmed counterparty when empty after strip", () => {
    expect(normalizeMerchant("  ")).toBe("");
  });
});
