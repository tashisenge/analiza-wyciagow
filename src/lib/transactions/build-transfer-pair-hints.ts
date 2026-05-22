import {
  buildPairedOwnAccountTransferKeys,
  findOwnAccountTransferPartnerKey,
  type OwnAccountTransferRef,
} from "@/lib/transactions/match-own-account-transfer-pairs";

export interface TransferPairTransactionRef {
  id: string;
  accountId: string;
  accountType: string;
  amount: string | { toString(): string };
  currency: string;
  bookedAt: Date;
}

function toOwnAccountRef(tx: TransferPairTransactionRef): OwnAccountTransferRef {
  return {
    key: tx.id,
    accountId: tx.accountId,
    amount: tx.amount,
    currency: tx.currency,
    bookedAt: tx.bookedAt,
  };
}

function storeTransferPairHints(
  hints: Map<string, string>,
  left: TransferPairTransactionRef,
  right: TransferPairTransactionRef,
): void {
  hints.set(
    left.id,
    `↔ Transfer na konto ${right.accountType} (${right.bookedAt.toISOString().slice(0, 10)})`,
  );
  hints.set(
    right.id,
    `↔ Transfer na konto ${left.accountType} (${left.bookedAt.toISOString().slice(0, 10)})`,
  );
}

export function buildTransferPairHintByTransactionId(
  transactions: TransferPairTransactionRef[],
): Map<string, string> {
  const hints = new Map<string, string>();
  const refs = transactions.map(toOwnAccountRef);
  const pairedKeys = buildPairedOwnAccountTransferKeys(refs);
  const byId = new Map(transactions.map((tx) => [tx.id, tx]));

  for (const left of transactions) {
    if (!pairedKeys.has(left.id) || hints.has(left.id)) {
      continue;
    }
    const partnerKey = findOwnAccountTransferPartnerKey(toOwnAccountRef(left), refs);
    const right = partnerKey ? byId.get(partnerKey) : undefined;
    if (right) {
      storeTransferPairHints(hints, left, right);
    }
  }

  return hints;
}
