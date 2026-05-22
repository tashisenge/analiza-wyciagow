import { isInternalTransfer } from "@/lib/transactions/is-internal-transfer";
import { normalizeAmountForMatch } from "@/lib/transactions/normalize-amount-for-match";

const MAX_DAY_GAP_MS = 5 * 24 * 60 * 60 * 1000;

export interface TransferPairTransactionRef {
  id: string;
  accountId: string;
  accountType: string;
  amount: string | { toString(): string };
  currency: string;
  bookedAt: Date;
  description: string;
}

function amountsAreOppositePair(left: number, right: number): boolean {
  return (
    Math.sign(left) !== 0 &&
    Math.sign(right) !== 0 &&
    Math.sign(left) !== Math.sign(right)
  );
}

function isTransferPairMatch(
  left: TransferPairTransactionRef,
  right: TransferPairTransactionRef,
): boolean {
  if (left.accountId === right.accountId || left.currency !== right.currency) {
    return false;
  }
  if (normalizeAmountForMatch(right.amount) !== normalizeAmountForMatch(left.amount)) {
    return false;
  }
  const leftAmount = Number(left.amount.toString());
  const rightAmount = Number(right.amount.toString());
  if (!amountsAreOppositePair(leftAmount, rightAmount)) {
    return false;
  }
  const dayGap = Math.abs(left.bookedAt.getTime() - right.bookedAt.getTime());
  return dayGap <= MAX_DAY_GAP_MS;
}

function findTransferPartner(
  left: TransferPairTransactionRef,
  candidates: TransferPairTransactionRef[],
): TransferPairTransactionRef | null {
  for (const right of candidates) {
    if (right.id === left.id) {
      continue;
    }
    if (isTransferPairMatch(left, right)) {
      return right;
    }
  }
  return null;
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
  const candidates = transactions.filter((tx) =>
    isInternalTransfer({ description: tx.description }),
  );

  for (const left of candidates) {
    if (hints.has(left.id)) {
      continue;
    }
    const right = findTransferPartner(left, candidates);
    if (right) {
      storeTransferPairHints(hints, left, right);
    }
  }

  return hints;
}
