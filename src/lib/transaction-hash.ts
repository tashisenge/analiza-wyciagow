import { createHash } from "crypto";

export interface DedupeInput {
  bookedAt: Date;
  amount: string;
  description: string;
  accountId: string;
  /**
   * 1-based occurrence of the same natural key within one import file.
   * Occurrence 1 keeps the legacy hash so existing rows stay stable on re-import.
   */
  occurrence?: number;
}

/** Stable natural key used to count identical rows inside a single CSV. */
export function buildNaturalDedupeKey(input: Omit<DedupeInput, "occurrence">): string {
  const day = input.bookedAt.toISOString().slice(0, 10);
  return [day, input.amount, input.description.trim(), input.accountId].join("|");
}

/** Assign the next 1-based occurrence for a natural key within the current file. */
export function nextOccurrenceInFile(
  counts: Map<string, number>,
  naturalKey: string,
): number {
  const next = (counts.get(naturalKey) ?? 0) + 1;
  counts.set(naturalKey, next);
  return next;
}

export function buildTransactionDedupeHash(input: DedupeInput): string {
  const base = buildNaturalDedupeKey(input);
  const occurrence = input.occurrence ?? 1;
  const payload = occurrence <= 1 ? base : `${base}|#${String(occurrence)}`;
  return createHash("sha256").update(payload).digest("hex");
}
