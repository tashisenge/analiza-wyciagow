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

function claimTransferPairHint(input: {
  left: TransferPairTransactionRef;
  refs: OwnAccountTransferRef[];
  byId: Map<string, TransferPairTransactionRef>;
  claimed: Set<string>;
  hints: Map<string, string>;
}): void {
  const partnerKey = findOwnAccountTransferPartnerKey(
    toOwnAccountRef(input.left),
    input.refs,
    input.claimed,
  );
  const right = partnerKey ? input.byId.get(partnerKey) : undefined;
  if (!right) {
    return;
  }
  input.claimed.add(input.left.id);
  input.claimed.add(right.id);
  storeTransferPairHints(input.hints, input.left, right);
}

export function buildTransferPairHintByTransactionId(
  transactions: TransferPairTransactionRef[],
): Map<string, string> {
  const hints = new Map<string, string>();
  const refs = transactions.map(toOwnAccountRef);
  const pairedKeys = buildPairedOwnAccountTransferKeys(refs);
  const byId = new Map(transactions.map((tx) => [tx.id, tx]));
  const claimed = new Set<string>();

  for (const left of transactions) {
    if (!pairedKeys.has(left.id) || hints.has(left.id)) {
      continue;
    }
    claimTransferPairHint({ left, refs, byId, claimed, hints });
  }

  return hints;
}
