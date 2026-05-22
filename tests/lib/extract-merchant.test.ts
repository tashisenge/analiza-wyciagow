import { describe, expect, it } from "vitest";

import { extractMerchantFromDescription } from "@/lib/extract-merchant";

describe("extractMerchantFromDescription", () => {
  it("extracts merchant before ZAKUP PRZY UŻYCIU KARTY", () => {
    const description = "NETTO  ZAKUP PRZY UŻYCIU KARTY W KRAJU transakcja nierozliczona";
    expect(extractMerchantFromDescription(description)).toBe("NETTO");
  });

  it("extracts merchant before comma for transfers", () => {
    const description = "KLIENT TESTOWY, PRZELEW WEWNĘTRZNY PRZYCHODZĄCY";
    expect(extractMerchantFromDescription(description)).toBe("KLIENT TESTOWY");
  });

  it("returns empty string for empty description", () => {
    expect(extractMerchantFromDescription("")).toBe("");
  });

  it("returns first token when no card marker or comma", () => {
    expect(extractMerchantFromDescription("APPLE KAPITALIZACJA ODSETEK")).toBe("APPLE");
  });
});
