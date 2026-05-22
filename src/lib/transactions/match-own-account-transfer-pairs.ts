import { normalizeAmountForMatch } from "@/lib/transactions/normalize-amount-for-match";

const MAX_DAY_GAP_MS = 5 * 24 * 60 * 60 * 1000;

export interface OwnAccountTransferRef {
  key: string;
  accountId: string;
  amount: string | { toString(): string };
  currency: string;
  bookedAt: Date;
}

function amountsAreOppositePair(left: number, right: number): boolean {
  return (
    Math.sign(left) !== 0 &&
    Math.sign(right) !== 0 &&
    Math.sign(left) !== Math.sign(right)
  );
}

function isOwnAccountTransferPair(
  left: OwnAccountTransferRef,
  right: OwnAccountTransferRef,
): boolean {
  if (left.key === right.key || left.accountId === right.accountId) {
    return false;
  }
  if (left.currency !== right.currency) {
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

export function findOwnAccountTransferPartnerKey(
  left: OwnAccountTransferRef,
  candidates: OwnAccountTransferRef[],
): string | null {
  for (const right of candidates) {
    if (isOwnAccountTransferPair(left, right)) {
      return right.key;
    }
  }
  return null;
}

/** Transakcje z parą na innym koncie w workspace (prawdziwy transfer między własnymi kontami). */
export function buildPairedOwnAccountTransferKeys(
  transactions: OwnAccountTransferRef[],
): Set<string> {
  const paired = new Set<string>();
  const usedPartners = new Set<string>();

  for (const left of transactions) {
    if (paired.has(left.key) || usedPartners.has(left.key)) {
      continue;
    }
    const partnerKey = findOwnAccountTransferPartnerKey(left, transactions);
    if (!partnerKey) {
      continue;
    }
    paired.add(left.key);
    paired.add(partnerKey);
    usedPartners.add(partnerKey);
  }

  return paired;
}

export function isOwnAccountTransferPaired(
  transactionKey: string,
  pairedKeys: Set<string>,
): boolean {
  return pairedKeys.has(transactionKey);
}
