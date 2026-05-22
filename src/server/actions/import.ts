"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import { processCsvImport } from "@/lib/import/process-csv-import";
import { logActionError } from "@/lib/logger";
import { buildCategoriesByName, syncMbankCategories } from "@/lib/mbank/sync-categories";
import { parseMbankCsv } from "@/lib/mbank-csv";

export type ImportCsvResult =
  | { ok: true; newCount: number; skippedCount: number }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

interface PersistImportInput {
  workspaceId: string;
  accountId: string;
  fileName: string;
  processed: ReturnType<typeof processCsvImport>;
}

async function persistImport(input: PersistImportInput): Promise<{
  newCount: number;
  skippedCount: number;
}> {
  const { workspaceId, accountId, fileName, processed } = input;
  const batch = await prisma.importBatch.create({
    data: { workspaceId, accountId, fileName, newCount: 0, skippedCount: 0 },
  });

  for (const row of processed.toInsert) {
    await prisma.transaction.create({
      data: {
        workspaceId,
        accountId,
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
      newCount: processed.toInsert.length,
      skippedCount: processed.skippedCount,
    },
  });

  return { newCount: processed.toInsert.length, skippedCount: processed.skippedCount };
}

async function runImport(
  workspaceId: string,
  accountId: string,
  file: File,
): Promise<ImportCsvResult> {
  const csvContent = await file.text();
  const rows = parseMbankCsv(csvContent);
  const [rules, memories, existing] = await Promise.all([
    prisma.categoryRule.findMany({ where: { workspaceId } }),
    prisma.merchantCategoryMemory.findMany({ where: { workspaceId } }),
    prisma.transaction.findMany({ where: { workspaceId }, select: { dedupeHash: true } }),
  ]);

  await syncMbankCategories(
    workspaceId,
    rows.map((row) => row.mbankCategory),
  );
  await ensureTransferCategory(workspaceId);
  const categoriesByName = await buildCategoriesByName(workspaceId);

  const processed = processCsvImport({
    csvContent,
    rows,
    accountId,
    existingHashes: new Set(existing.map((row) => row.dedupeHash)),
    rules,
    memories,
    categoriesByName,
  });

  const counts = await persistImport({
    workspaceId,
    accountId,
    fileName: file.name,
    processed,
  });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true, ...counts };
}

export async function importCsv(formData: FormData): Promise<ImportCsvResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const accountIdRaw = formData.get("accountId");
  const accountId = typeof accountIdRaw === "string" ? accountIdRaw : "";
  const file = formData.get("file");
  if (!accountId || !(file instanceof File)) {
    return { ok: false, error: "Wybierz konto i plik CSV" };
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, workspaceId },
  });
  if (!account) {
    return { ok: false, error: "Nie znaleziono konta" };
  }

  try {
    return await runImport(workspaceId, accountId, file);
  } catch (error) {
    return {
      ok: false,
      error: logActionError("import.csv", error, {
        context: { workspaceId, accountId, fileName: file.name },
        fallbackMessage: "Błąd importu",
      }),
    };
  }
}
