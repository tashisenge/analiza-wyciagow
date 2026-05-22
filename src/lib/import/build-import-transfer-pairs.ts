import type { ParsedMbankRow } from "@/lib/mbank-csv";
import { buildTransactionDedupeHash } from "@/lib/transaction-hash";
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

function importRowKey(row: ParsedMbankRow, accountId: string): string {
  return buildTransactionDedupeHash({
    bookedAt: row.bookedAt,
    amount: row.amount,
    description: row.description,
    accountId,
  });
}

function rowToRef(row: ParsedMbankRow, accountId: string): OwnAccountTransferRef {
  return {
    key: importRowKey(row, accountId),
    accountId,
    amount: row.amount,
    currency: row.currency,
    bookedAt: row.bookedAt,
  };
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
  const refs: OwnAccountTransferRef[] = [
    ...rows.map((row) => rowToRef(row, accountId)),
    ...existing.map(existingToRef),
  ];
  const paired = buildPairedOwnAccountTransferKeys(refs);
  const importKeys = new Set(rows.map((row) => importRowKey(row, accountId)));
  const result = new Set<string>();
  for (const key of paired) {
    if (importKeys.has(key)) {
      result.add(key);
    }
  }
  return result;
}
