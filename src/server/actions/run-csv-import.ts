import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import { buildImportPairedTransferKeys } from "@/lib/import/build-import-transfer-pairs";
import { processCsvImport } from "@/lib/import/process-csv-import";
import { buildCategoriesByName, syncMbankCategories } from "@/lib/mbank/sync-categories";
import { parseMbankCsv } from "@/lib/mbank-csv";
import type { ImportCsvResult } from "@/server/actions/import";

interface RunCsvImportInput {
  workspaceId: string;
  accountId: string;
  file: File;
}

interface PersistImportOptions {
  workspaceId: string;
  accountId: string;
  fileName: string;
  processed: ReturnType<typeof processCsvImport>;
}

async function persistImport(
  options: PersistImportOptions,
): Promise<{ newCount: number; skippedCount: number }> {
  const batch = await prisma.importBatch.create({
    data: {
      workspaceId: options.workspaceId,
      accountId: options.accountId,
      fileName: options.fileName,
      newCount: 0,
      skippedCount: 0,
    },
  });

  for (const row of options.processed.toInsert) {
    await prisma.transaction.create({
      data: {
        workspaceId: options.workspaceId,
        accountId: options.accountId,
        importBatchId: batch.id,
        dedupeHash: row.dedupeHash,
        bookedAt: row.bookedAt,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        counterparty: row.counterparty,
        mbankCategory: row.mbankCategory,
        categoryId: row.categoryId,
      },
    });
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      newCount: options.processed.toInsert.length,
      skippedCount: options.processed.skippedCount,
    },
  });

  return {
    newCount: options.processed.toInsert.length,
    skippedCount: options.processed.skippedCount,
  };
}

export async function runCsvImport(input: RunCsvImportInput): Promise<ImportCsvResult> {
  const csvContent = await input.file.text();
  const rows = parseMbankCsv(csvContent);
  const [rules, memories, existing] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId: input.workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId: input.workspaceId } }),
    prisma.transaction.findMany({
      where: { workspaceId: input.workspaceId },
      select: {
        dedupeHash: true,
        accountId: true,
        amount: true,
        currency: true,
        bookedAt: true,
      },
    }),
  ]);

  await syncMbankCategories(
    input.workspaceId,
    rows.map((row) => row.mbankCategory),
  );
  await ensureTransferCategory(input.workspaceId);
  const categoriesByName = await buildCategoriesByName(input.workspaceId);
  const pairedImportKeys = buildImportPairedTransferKeys(input.accountId, rows, existing);
  const processed = processCsvImport({
    csvContent,
    rows,
    accountId: input.accountId,
    existingHashes: new Set(existing.map((row) => row.dedupeHash)),
    rules,
    memories,
    categoriesByName,
    pairedImportKeys,
  });

  const counts = await persistImport({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    fileName: input.file.name,
    processed,
  });
  return { ok: true, ...counts };
}
