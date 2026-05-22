import type { CategoryRuleInput } from "@/lib/categorization/apply-rules";
import { categorizeTransaction } from "@/lib/categorization/categorize-transaction";
import type { MerchantMemoryInput } from "@/lib/categorization/merchant-memory";
import { parseMbankCsv, type ParsedMbankRow } from "@/lib/mbank-csv";
import { buildTransactionDedupeHash } from "@/lib/transaction-hash";

export interface ImportProcessInput {
  csvContent: string;
  accountId: string;
  existingHashes: Set<string>;
  rules: CategoryRuleInput[];
  memories: MerchantMemoryInput[];
  categoriesByName: Map<string, string>;
  /** Jeśli podane — pomija ponowne parsowanie CSV (np. po sync kategorii mBank). */
  rows?: ParsedMbankRow[];
}

export interface ImportProcessResult {
  rows: ParsedMbankRow[];
  toInsert: (ParsedMbankRow & { dedupeHash: string; categoryId: string | null })[];
  skippedCount: number;
}

type PreparedRow = ImportProcessResult["toInsert"][number];

function rowDedupeHash(row: ParsedMbankRow, accountId: string): string {
  return buildTransactionDedupeHash({
    bookedAt: row.bookedAt,
    amount: row.amount,
    description: row.description,
    accountId,
  });
}

function prepareImportRow(
  row: ParsedMbankRow,
  input: ImportProcessInput,
  seenHashes: Set<string>,
): PreparedRow | null {
  const dedupeHash = rowDedupeHash(row, input.accountId);
  if (seenHashes.has(dedupeHash)) {
    return null;
  }
  seenHashes.add(dedupeHash);
  const categoryId = categorizeTransaction(
    row,
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
  let skippedCount = 0;

  for (const row of rows) {
    const prepared = prepareImportRow(row, input, seenHashes);
    if (!prepared) {
      skippedCount += 1;
      continue;
    }
    toInsert.push(prepared);
  }

  return { rows, toInsert, skippedCount };
}
