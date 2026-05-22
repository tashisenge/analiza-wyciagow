import { describe, expect, it } from "vitest";

import {
  formatDisplayAmount,
  formatMaskedAmount,
} from "@/lib/privacy/format-display-amount";

describe("formatDisplayAmount", () => {
  it("formats PLN amount", () => {
    expect(formatDisplayAmount(1234.5)).toBe("1234.50 PLN");
  });
});

describe("formatMaskedAmount", () => {
  it("returns masked placeholder", () => {
    expect(formatMaskedAmount()).toBe("•••••• PLN");
  });
});
