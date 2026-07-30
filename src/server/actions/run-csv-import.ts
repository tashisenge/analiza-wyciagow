import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import { buildTransferPartnerBackfillUpdate } from "@/lib/import/backfill-existing-transfer-partners";
import {
  buildImportPairedTransferKeys,
  type ExistingTransferRef,
} from "@/lib/import/build-import-transfer-pairs";
import { processCsvImport } from "@/lib/import/process-csv-import";
import { buildCategoriesByName, syncMbankCategories } from "@/lib/mbank/sync-categories";
import { parseMbankCsv, type ParsedMbankRow } from "@/lib/mbank-csv";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";
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

interface PrepareCsvImportOptions {
  workspaceId: string;
  accountId: string;
  csvContent: string;
  rows: ParsedMbankRow[];
  existing: ExistingTransferRef[];
  rules: Awaited<ReturnType<typeof prisma.categoryRule.findMany>>;
  memories: Awaited<ReturnType<typeof prisma.merchantCategoryMemory.findMany>>;
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

async function backfillExistingTransferPartners(
  workspaceId: string,
  categoriesByName: Map<string, string>,
  existingPartnerHashes: Set<string>,
): Promise<void> {
  const partnerBackfill = buildTransferPartnerBackfillUpdate({
    workspaceId,
    transferCategoryId: categoriesByName.get(TRANSFER_BETWEEN_ACCOUNTS_CATEGORY) ?? null,
    existingPartnerHashes,
  });
  if (partnerBackfill) {
    await prisma.transaction.updateMany(partnerBackfill);
  }
}

async function prepareCsvImport(options: PrepareCsvImportOptions): Promise<{
  processed: ReturnType<typeof processCsvImport>;
  categoriesByName: Map<string, string>;
  existingPartnerHashes: Set<string>;
}> {
  await syncMbankCategories(
    options.workspaceId,
    options.rows.map((row) => row.mbankCategory),
  );
  await ensureTransferCategory(options.workspaceId);
  const categoriesByName = await buildCategoriesByName(options.workspaceId);
  const { pairedImportKeys, existingPartnerHashes } = buildImportPairedTransferKeys(
    options.accountId,
    options.rows,
    options.existing,
  );
  const processed = processCsvImport({
    csvContent: options.csvContent,
    rows: options.rows,
    accountId: options.accountId,
    existingHashes: new Set(options.existing.map((row) => row.dedupeHash)),
    rules: options.rules,
    memories: options.memories,
    categoriesByName,
    pairedImportKeys,
  });
  return { processed, categoriesByName, existingPartnerHashes };
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

  const { processed, categoriesByName, existingPartnerHashes } = await prepareCsvImport({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    csvContent,
    rows,
    existing,
    rules,
    memories,
  });
  const counts = await persistImport({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    fileName: input.file.name,
    processed,
  });
  await backfillExistingTransferPartners(
    input.workspaceId,
    categoriesByName,
    existingPartnerHashes,
  );
  return { ok: true, ...counts };
}
