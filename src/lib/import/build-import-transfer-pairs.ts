import type { ParsedMbankRow } from "@/lib/mbank-csv";
import {
  buildNaturalDedupeKey,
  buildTransactionDedupeHash,
  nextOccurrenceInFile,
} from "@/lib/transaction-hash";
import {
  buildPairedOwnAccountTransferKeys,
  type OwnAccountTransferRef,
} from "@/lib/transactions/match-own-account-transfer-pairs";

export interface ExistingTransferRef {
  dedupeHash: string;
  accountId: string;
  amount: { toString(): string };
  currency: string;
  bookedAt: Date;
}

function importRowKey(
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

function rowsToRefs(rows: ParsedMbankRow[], accountId: string): OwnAccountTransferRef[] {
  const occurrenceCounts = new Map<string, number>();
  return rows.map((row) => {
    const naturalKey = buildNaturalDedupeKey({
      bookedAt: row.bookedAt,
      amount: row.amount,
      description: row.description,
      accountId,
    });
    const occurrence = nextOccurrenceInFile(occurrenceCounts, naturalKey);
    return {
      key: importRowKey(row, accountId, occurrence),
      accountId,
      amount: row.amount,
      currency: row.currency,
      bookedAt: row.bookedAt,
    };
  });
}

function existingToRef(tx: ExistingTransferRef): OwnAccountTransferRef {
  return {
    key: tx.dedupeHash,
    accountId: tx.accountId,
    amount: tx.amount,
    currency: tx.currency,
    bookedAt: tx.bookedAt,
  };
}

export function buildImportPairedTransferKeys(
  accountId: string,
  rows: ParsedMbankRow[],
  existing: ExistingTransferRef[],
): Set<string> {
  const rowRefs = rowsToRefs(rows, accountId);
  const refs: OwnAccountTransferRef[] = [...rowRefs, ...existing.map(existingToRef)];
  const paired = buildPairedOwnAccountTransferKeys(refs);
  const importKeys = new Set(rowRefs.map((ref) => ref.key));
  const result = new Set<string>();
  for (const key of paired) {
    if (importKeys.has(key)) {
      result.add(key);
    }
  }
  return result;
}
