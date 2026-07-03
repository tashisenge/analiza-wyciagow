import type { Prisma } from "@prisma/client";

import type { TransactionSortState } from "@/lib/transactions/transaction-sort";

export const TRANSACTION_PAGE_SIZE = 50;

export interface KeysetCursor {
  kind: "keyset";
  bookedAt: Date;
  id: string;
}

export interface OffsetCursor {
  kind: "offset";
  skip: number;
}

export type TransactionCursor = KeysetCursor | OffsetCursor;

export function encodeTransactionCursor(cursor: TransactionCursor): string {
  if (cursor.kind === "offset") {
    return `off:${String(cursor.skip)}`;
  }
  return `${cursor.bookedAt.toISOString()}|${cursor.id}`;
}

function decodeOffsetCursor(raw: string): OffsetCursor | null {
  const skip = Number.parseInt(raw.slice(4), 10);
  if (!Number.isFinite(skip) || skip < 0) {
    return null;
  }
  return { kind: "offset", skip };
}

function decodeKeysetCursor(raw: string): KeysetCursor | null {
  const separator = raw.indexOf("|");
  if (separator <= 0) {
    return null;
  }
  const bookedAt = new Date(raw.slice(0, separator));
  const id = raw.slice(separator + 1);
  if (Number.isNaN(bookedAt.getTime()) || !id) {
    return null;
  }
  return { kind: "keyset", bookedAt, id };
}

export function decodeTransactionCursor(
  raw: string | undefined,
): TransactionCursor | null {
  if (!raw?.trim()) {
    return null;
  }
  if (raw.startsWith("off:")) {
    return decodeOffsetCursor(raw);
  }
  return decodeKeysetCursor(raw);
}

export function cursorModeForSort(sort: TransactionSortState): "keyset" | "offset" {
  return sort.field === "date" ? "keyset" : "offset";
}

export function buildKeysetCursorWhere(
  cursor: KeysetCursor,
  direction: "asc" | "desc",
): Prisma.TransactionWhereInput {
  if (direction === "desc") {
    return {
      OR: [
        { bookedAt: { lt: cursor.bookedAt } },
        { bookedAt: cursor.bookedAt, id: { lt: cursor.id } },
      ],
    };
  }
  return {
    OR: [
      { bookedAt: { gt: cursor.bookedAt } },
      { bookedAt: cursor.bookedAt, id: { gt: cursor.id } },
    ],
  };
}

export function resolvePaginationCursor(
  raw: string | undefined,
  sort: TransactionSortState,
): TransactionCursor | null {
  const decoded = decodeTransactionCursor(raw);
  if (!decoded) {
    return null;
  }
  const mode = cursorModeForSort(sort);
  if (mode === "keyset" && decoded.kind === "keyset") {
    return decoded;
  }
  if (mode === "offset" && decoded.kind === "offset") {
    return decoded;
  }
  return null;
}

interface CursorRow {
  bookedAt: Date;
  id: string;
}

export function nextPageCursor(
  rows: CursorRow[],
  sort: TransactionSortState,
  current: TransactionCursor | null,
): string | null {
  if (rows.length < TRANSACTION_PAGE_SIZE) {
    return null;
  }
  const last = rows[rows.length - 1];
  if (!last) {
    return null;
  }
  if (cursorModeForSort(sort) === "keyset") {
    return encodeTransactionCursor({
      kind: "keyset",
      bookedAt: last.bookedAt,
      id: last.id,
    });
  }
  const skip =
    current?.kind === "offset"
      ? current.skip + TRANSACTION_PAGE_SIZE
      : TRANSACTION_PAGE_SIZE;
  return encodeTransactionCursor({ kind: "offset", skip });
}
