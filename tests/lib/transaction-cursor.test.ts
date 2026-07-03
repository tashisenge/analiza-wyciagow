import { describe, expect, it } from "vitest";

import {
  buildKeysetCursorWhere,
  cursorModeForSort,
  decodeTransactionCursor,
  encodeTransactionCursor,
  nextPageCursor,
  resolvePaginationCursor,
  TRANSACTION_PAGE_SIZE,
} from "@/lib/transactions/transaction-cursor";

describe("transaction-cursor", () => {
  it("encodes and decodes keyset cursor", () => {
    const bookedAt = new Date("2026-01-15T10:00:00.000Z");
    const raw = encodeTransactionCursor({ kind: "keyset", bookedAt, id: "tx-1" });
    expect(decodeTransactionCursor(raw)).toEqual({
      kind: "keyset",
      bookedAt,
      id: "tx-1",
    });
  });

  it("encodes and decodes offset cursor", () => {
    const raw = encodeTransactionCursor({ kind: "offset", skip: 50 });
    expect(decodeTransactionCursor(raw)).toEqual({ kind: "offset", skip: 50 });
  });

  it("builds keyset where for descending order", () => {
    const where = buildKeysetCursorWhere(
      { kind: "keyset", bookedAt: new Date("2026-01-01"), id: "a" },
      "desc",
    );
    expect(where.OR).toHaveLength(2);
  });

  it("resolves cursor only when mode matches sort", () => {
    const keyset = encodeTransactionCursor({
      kind: "keyset",
      bookedAt: new Date("2026-01-01"),
      id: "a",
    });
    expect(
      resolvePaginationCursor(keyset, { field: "date", direction: "desc" })?.kind,
    ).toBe("keyset");
    expect(
      resolvePaginationCursor(keyset, { field: "name", direction: "desc" }),
    ).toBeNull();
  });

  it("returns next offset cursor for name sort", () => {
    const rows = Array.from({ length: TRANSACTION_PAGE_SIZE }, (_, index) => ({
      id: `tx-${String(index)}`,
      bookedAt: new Date(),
    }));
    const next = nextPageCursor(rows, { field: "name", direction: "asc" }, null);
    expect(next).toBe(`off:${String(TRANSACTION_PAGE_SIZE)}`);
  });

  it("returns null next cursor when page is short", () => {
    const rows = [{ id: "tx-1", bookedAt: new Date() }];
    expect(nextPageCursor(rows, { field: "date", direction: "desc" }, null)).toBeNull();
  });

  it("uses keyset mode only for date sort", () => {
    expect(cursorModeForSort({ field: "date", direction: "desc" })).toBe("keyset");
    expect(cursorModeForSort({ field: "similar", direction: "desc" })).toBe("offset");
  });
});
