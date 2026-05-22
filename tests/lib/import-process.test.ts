import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { processCsvImport } from "@/lib/import/process-csv-import";

const FIXTURE = join(process.cwd(), "tests/fixtures/mbank-sample.csv");

describe("processCsvImport", () => {
  it("parses and prepares new transactions", () => {
    const csv = readFileSync(FIXTURE, "utf-8");
    const result = processCsvImport({
      csvContent: csv,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    expect(result.toInsert).toHaveLength(4);
    expect(result.skippedCount).toBe(0);
  });

  it("skips duplicate rows within one CSV", () => {
    const csv = readFileSync(FIXTURE, "utf-8");
    const lines = csv.split("\n");
    const firstTxLine = lines.find((line) => line.startsWith("2026-05-20;")) ?? "";
    const duplicateRow = `${csv.trim()}\n${firstTxLine}`;
    const result = processCsvImport({
      csvContent: duplicateRow,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    expect(result.toInsert).toHaveLength(4);
    expect(result.skippedCount).toBe(1);
  });

  it("skips duplicate hashes", () => {
    const csv = readFileSync(FIXTURE, "utf-8");
    const first = processCsvImport({
      csvContent: csv,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    const hashes = new Set(first.toInsert.map((row) => row.dedupeHash));
    const second = processCsvImport({
      csvContent: csv,
      accountId: "acc_dom",
      existingHashes: hashes,
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    expect(second.toInsert).toHaveLength(0);
    expect(second.skippedCount).toBe(4);
  });
});
