import { prisma } from "@/lib/db";
import { buildPairedOwnAccountTransferKeys } from "@/lib/transactions/match-own-account-transfer-pairs";

const MAX_DAY_GAP_MS = 5 * 24 * 60 * 60 * 1000;

export interface TransferPairLookupInput {
  workspaceId: string;
  accountIds: string[];
  anchorTransactions: {
    id: string;
    accountId: string;
    amount: { toString(): string };
    currency: string;
    bookedAt: Date;
  }[];
}

function bookingWindow(transactions: TransferPairLookupInput["anchorTransactions"]): {
  minDate: Date;
  maxDate: Date;
} {
  const times = transactions.map((tx) => tx.bookedAt.getTime());
  return {
    minDate: new Date(Math.min(...times) - MAX_DAY_GAP_MS),
    maxDate: new Date(Math.max(...times) + MAX_DAY_GAP_MS),
  };
}

export async function loadPairedOwnAccountTransferKeys(
  input: TransferPairLookupInput,
): Promise<Set<string>> {
  if (input.anchorTransactions.length === 0) {
    return new Set();
  }

  const { minDate, maxDate } = bookingWindow(input.anchorTransactions);
  const candidates = await prisma.transaction.findMany({
    where: {
      workspaceId: input.workspaceId,
      accountId: { in: input.accountIds },
      bookedAt: { gte: minDate, lte: maxDate },
    },
    select: { id: true, accountId: true, amount: true, currency: true, bookedAt: true },
  });

  return buildPairedOwnAccountTransferKeys(
    candidates.map((tx) => ({
      key: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  );
}
