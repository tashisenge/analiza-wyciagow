import { describe, expect, it } from "vitest";

import {
  buildTransactionOrderBy,
  parseTransactionSort,
  sortTransactionRows,
} from "@/lib/transactions/transaction-sort";

describe("transaction-sort", () => {
  it("defaults to date desc", () => {
    expect(parseTransactionSort({})).toEqual({ field: "date", direction: "desc" });
  });

  it("parses name asc", () => {
    expect(parseTransactionSort({ sort: "name", sortDir: "asc" })).toEqual({
      field: "name",
      direction: "asc",
    });
  });

  it("builds prisma order for counterparty", () => {
    expect(buildTransactionOrderBy({ field: "name", direction: "asc" })).toEqual({
      counterparty: "asc",
    });
  });

  it("sorts rows by counterparty", () => {
    const rows = sortTransactionRows(
      [
        {
          id: "b",
          counterparty: "Żabka",
          bookedAt: new Date("2026-01-02"),
          similarCounts: { byCounterparty: 0 },
        },
        {
          id: "a",
          counterparty: "Allegro",
          bookedAt: new Date("2026-01-01"),
          similarCounts: { byCounterparty: 0 },
        },
      ],
      { field: "name", direction: "asc" },
    );
    expect(rows.map((row) => row.counterparty)).toEqual(["Allegro", "Żabka"]);
  });

  it("sorts rows by similar count desc", () => {
    const rows = sortTransactionRows(
      [
        {
          id: "low",
          counterparty: "A",
          bookedAt: new Date("2026-01-01"),
          similarCounts: { byCounterparty: 1 },
        },
        {
          id: "high",
          counterparty: "B",
          bookedAt: new Date("2026-01-02"),
          similarCounts: { byCounterparty: 5 },
        },
      ],
      { field: "similar", direction: "desc" },
    );
    expect(rows.map((row) => row.id)).toEqual(["high", "low"]);
  });

  it("leaves rows unchanged for date sort", () => {
    const input = [
      {
        id: "first",
        counterparty: "A",
        bookedAt: new Date("2026-01-01"),
        similarCounts: { byCounterparty: 0 },
      },
    ];
    expect(sortTransactionRows(input, { field: "date", direction: "desc" })).toBe(input);
  });
});
