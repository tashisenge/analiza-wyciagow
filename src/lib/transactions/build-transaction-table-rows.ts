import { buildTransferPairHintByTransactionId } from "@/lib/transactions/build-transfer-pair-hints";
import { isOwnAccountTransferPaired } from "@/lib/transactions/match-own-account-transfer-pairs";
import type { SimilarTransactionCounts } from "@/lib/transactions/similar-transaction-count";

export interface TransactionForTableRow {
  id: string;
  accountId: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  mbankCategory: string;
  amount: { toString(): string };
  currency: string;
  categoryId: string | null;
  category: { name: string } | null;
  account: { type: string };
}

export interface TransactionTableRow extends TransactionForTableRow {
  suggestedCategoryId: string;
  similarCounts: SimilarTransactionCounts;
  isOwnAccountTransfer: boolean;
  transferPairHint: string | null;
}

interface BuildTransactionTableRowsInput {
  transactions: TransactionForTableRow[];
  transferCategoryId: string;
  similarCounts: Map<string, SimilarTransactionCounts>;
  pairedTransferKeys: Set<string>;
  transferHints: Map<string, string>;
}

function mapTransactionRow(
  tx: TransactionForTableRow,
  input: BuildTransactionTableRowsInput,
): TransactionTableRow {
  const isOwnAccountTransfer = isOwnAccountTransferPaired(
    tx.id,
    input.pairedTransferKeys,
  );
  return {
    ...tx,
    suggestedCategoryId:
      tx.categoryId ?? (isOwnAccountTransfer ? input.transferCategoryId : ""),
    similarCounts: input.similarCounts.get(tx.id) ?? {
      byCounterparty: 0,
      byCounterpartyAndAmount: 0,
    },
    isOwnAccountTransfer,
    transferPairHint: input.transferHints.get(tx.id) ?? null,
  };
}

export function buildTransactionTableRows(
  input: Omit<BuildTransactionTableRowsInput, "transferHints">,
): TransactionTableRow[] {
  const transferHints = buildTransferPairHintByTransactionId(
    input.transactions.map((tx) => ({
      id: tx.id,
      accountId: tx.accountId,
      accountType: tx.account.type,
      amount: tx.amount.toString(),
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  );
  const withHints: BuildTransactionTableRowsInput = { ...input, transferHints };
  return input.transactions.map((tx) => mapTransactionRow(tx, withHints));
}
