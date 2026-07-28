import { describe, expect, it } from "vitest";

import {
  buildNaturalDedupeKey,
  buildTransactionDedupeHash,
  nextOccurrenceInFile,
} from "@/lib/transaction-hash";

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

  it("keeps legacy hash for occurrence 1 and differs for later occurrences", () => {
    const base = {
      bookedAt: new Date("2025-03-01"),
      amount: "-15.00",
      description: "STARBUCKS ZAKUP PRZY UŻYCIU KARTY W KRAJU",
      accountId: "acc_1",
    };
    const first = buildTransactionDedupeHash(base);
    const explicitFirst = buildTransactionDedupeHash({ ...base, occurrence: 1 });
    const second = buildTransactionDedupeHash({ ...base, occurrence: 2 });
    expect(explicitFirst).toBe(first);
    expect(second).not.toBe(first);
  });
});

describe("nextOccurrenceInFile", () => {
  it("counts identical natural keys starting at 1", () => {
    const counts = new Map<string, number>();
    const key = buildNaturalDedupeKey({
      bookedAt: new Date("2025-03-01"),
      amount: "-15.00",
      description: "STARBUCKS",
      accountId: "acc_1",
    });
    expect(nextOccurrenceInFile(counts, key)).toBe(1);
    expect(nextOccurrenceInFile(counts, key)).toBe(2);
    expect(nextOccurrenceInFile(counts, key)).toBe(3);
  });
});
