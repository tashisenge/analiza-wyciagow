import type { Prisma } from "@prisma/client";

export type TxWithCategory = Prisma.TransactionGetPayload<{
  include: { category: true };
}>;
