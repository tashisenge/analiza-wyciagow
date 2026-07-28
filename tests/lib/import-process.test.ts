import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { buildImportPairedTransferKeys } from "@/lib/import/build-import-transfer-pairs";
import { processCsvImport } from "@/lib/import/process-csv-import";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

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

  it("keeps identical rows in one CSV as distinct occurrences", () => {
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
    expect(result.toInsert).toHaveLength(5);
    expect(result.skippedCount).toBe(0);
    const hashes = result.toInsert.map((row) => row.dedupeHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("recovers a previously dropped identical second purchase on re-import", () => {
    const csv = readFileSync(FIXTURE, "utf-8");
    const lines = csv.split("\n");
    const firstTxLine = lines.find((line) => line.startsWith("2026-05-20;")) ?? "";
    const withTwin = `${csv.trim()}\n${firstTxLine}`;
    const full = processCsvImport({
      csvContent: withTwin,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    const nettoRows = full.toInsert.filter((row) => row.description.includes("NETTO"));
    expect(nettoRows).toHaveLength(2);
    const secondNettoHash = nettoRows[1]!.dedupeHash;
    // Simulate pre-fix DB that only stored occurrence 1 of the identical pair.
    const legacyHashes = new Set(
      full.toInsert
        .filter((row) => row.dedupeHash !== secondNettoHash)
        .map((row) => row.dedupeHash),
    );
    const recovered = processCsvImport({
      csvContent: withTwin,
      accountId: "acc_dom",
      existingHashes: legacyHashes,
      rules: [],
      memories: [],
      categoriesByName: new Map([["Żywność", "cat-food"]]),
    });
    expect(recovered.toInsert).toHaveLength(1);
    expect(recovered.toInsert[0]?.dedupeHash).toBe(secondNettoHash);
    expect(recovered.skippedCount).toBe(4);
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

  it("assigns transfer category only for rows paired with other account", () => {
    const csv = readFileSync(FIXTURE, "utf-8");
    const bookedAt = new Date("2026-05-21");
    const rows = processCsvImport({
      csvContent: csv,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([[TRANSFER_BETWEEN_ACCOUNTS_CATEGORY, "cat-transfer"]]),
    }).rows;
    const pairedKeys = buildImportPairedTransferKeys("acc_dom", rows, [
      {
        dedupeHash: "firma-out",
        accountId: "acc_firma",
        amount: "-1900.00",
        currency: "PLN",
        bookedAt,
      },
    ]);
    const result = processCsvImport({
      csvContent: csv,
      accountId: "acc_dom",
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName: new Map([[TRANSFER_BETWEEN_ACCOUNTS_CATEGORY, "cat-transfer"]]),
      pairedImportKeys: pairedKeys,
    });
    const transferRow = result.toInsert.find((row) => row.amount === "1900.00");
    expect(transferRow?.categoryId).toBe("cat-transfer");
    const shopRow = result.toInsert.find((row) => row.counterparty === "LIDL");
    expect(shopRow?.categoryId).not.toBe("cat-transfer");
  });
});
