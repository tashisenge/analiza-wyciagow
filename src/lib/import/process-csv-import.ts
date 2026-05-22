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

export function processCsvImport(input: ImportProcessInput): ImportProcessResult {
  const rows = input.rows ?? parseMbankCsv(input.csvContent);
  const toInsert: ImportProcessResult["toInsert"] = [];
  let skippedCount = 0;

  for (const row of rows) {
    const dedupeHash = buildTransactionDedupeHash({
      bookedAt: row.bookedAt,
      amount: row.amount,
      description: row.description,
      accountId: input.accountId,
    });
    if (input.existingHashes.has(dedupeHash)) {
      skippedCount += 1;
      continue;
    }
    const categoryId = categorizeTransaction(
      row,
      input.rules,
      input.memories,
      input.categoriesByName,
    );
    toInsert.push({ ...row, dedupeHash, categoryId });
  }

  return { rows, toInsert, skippedCount };
}
