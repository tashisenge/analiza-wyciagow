import type { CategoryRuleInput } from "@/lib/categorization/apply-rules";
import { categorizeTransaction } from "@/lib/categorization/categorize-transaction";
import type { MerchantMemoryInput } from "@/lib/categorization/merchant-memory";
import { parseMbankCsv, type ParsedMbankRow } from "@/lib/mbank-csv";
import {
  buildNaturalDedupeKey,
  buildTransactionDedupeHash,
  nextOccurrenceInFile,
} from "@/lib/transaction-hash";

export interface ImportProcessInput {
  csvContent: string;
  accountId: string;
  existingHashes: Set<string>;
  rules: CategoryRuleInput[];
  memories: MerchantMemoryInput[];
  categoriesByName: Map<string, string>;
  pairedImportKeys?: Set<string>;
  /** Jeśli podane — pomija ponowne parsowanie CSV (np. po sync kategorii mBank). */
  rows?: ParsedMbankRow[];
}

export interface ImportProcessResult {
  rows: ParsedMbankRow[];
  toInsert: (ParsedMbankRow & { dedupeHash: string; categoryId: string | null })[];
  skippedCount: number;
}

type PreparedRow = ImportProcessResult["toInsert"][number];

function rowDedupeHash(
  row: ParsedMbankRow,
  accountId: string,
  occurrence: number,
): string {
  return buildTransactionDedupeHash({
    bookedAt: row.bookedAt,
    amount: row.amount,
    description: row.description,
    accountId,
    occurrence,
  });
}

function prepareImportRow(
  row: ParsedMbankRow,
  input: ImportProcessInput,
  seenHashes: Set<string>,
  occurrenceCounts: Map<string, number>,
): PreparedRow | null {
  const naturalKey = buildNaturalDedupeKey({
    bookedAt: row.bookedAt,
    amount: row.amount,
    description: row.description,
    accountId: input.accountId,
  });
  const occurrence = nextOccurrenceInFile(occurrenceCounts, naturalKey);
  const dedupeHash = rowDedupeHash(row, input.accountId, occurrence);
  if (seenHashes.has(dedupeHash)) {
    return null;
  }
  seenHashes.add(dedupeHash);
  const categoryId = categorizeTransaction(
    {
      ...row,
      isPairedOwnAccountTransfer: input.pairedImportKeys?.has(dedupeHash) ?? false,
    },
    input.rules,
    input.memories,
    input.categoriesByName,
  );
  return { ...row, dedupeHash, categoryId };
}

export function processCsvImport(input: ImportProcessInput): ImportProcessResult {
  const rows = input.rows ?? parseMbankCsv(input.csvContent);
  const toInsert: ImportProcessResult["toInsert"] = [];
  const seenHashes = new Set(input.existingHashes);
  const occurrenceCounts = new Map<string, number>();
  let skippedCount = 0;

  for (const row of rows) {
    const prepared = prepareImportRow(row, input, seenHashes, occurrenceCounts);
    if (!prepared) {
      skippedCount += 1;
      continue;
    }
    toInsert.push(prepared);
  }

  return { rows, toInsert, skippedCount };
}
