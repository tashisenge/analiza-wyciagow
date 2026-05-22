import { createHash } from "crypto";

export interface DedupeInput {
  bookedAt: Date;
  amount: string;
  description: string;
  accountId: string;
}

export function buildTransactionDedupeHash(input: DedupeInput): string {
  const day = input.bookedAt.toISOString().slice(0, 10);
  const payload = [day, input.amount, input.description.trim(), input.accountId].join(
    "|",
  );
  return createHash("sha256").update(payload).digest("hex");
}
