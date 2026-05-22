import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { processCsvImport } from "@/lib/import/process-csv-import";
import { buildCategoriesByName, syncMbankCategories } from "@/lib/mbank/sync-categories";
import { parseMbankCsv } from "@/lib/mbank-csv";

const FIXTURE = join(process.cwd(), "tests/fixtures/mbank-sample.csv");
const HAS_DB = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!HAS_DB)("import flow integration", () => {
  it("imports fixture rows without duplicate on second run", async () => {
    const workspace = await prisma.workspace.create({ data: { name: "Test WS" } });
    const account = await prisma.account.create({
      data: { workspaceId: workspace.id, type: "dom", name: "Test" },
    });
    const csv = readFileSync(FIXTURE, "utf-8");
    const rows = parseMbankCsv(csv);
    await syncMbankCategories(
      workspace.id,
      rows.map((row) => row.mbankCategory),
    );
    const categoriesByName = await buildCategoriesByName(workspace.id);

    const first = processCsvImport({
      csvContent: csv,
      rows,
      accountId: account.id,
      existingHashes: new Set(),
      rules: [],
      memories: [],
      categoriesByName,
    });
    expect(first.toInsert.length).toBeGreaterThan(0);

    const hashes = new Set(first.toInsert.map((row) => row.dedupeHash));
    const second = processCsvImport({
      csvContent: csv,
      rows,
      accountId: account.id,
      existingHashes: hashes,
      rules: [],
      memories: [],
      categoriesByName,
    });
    expect(second.toInsert).toHaveLength(0);
    expect(second.skippedCount).toBe(first.toInsert.length);

    await prisma.workspace.delete({ where: { id: workspace.id } });
  });
});
