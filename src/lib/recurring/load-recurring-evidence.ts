import { prisma } from "@/lib/db";
import type { RecurringEvidenceTx } from "@/lib/recurring/recurring-suspect-types";

export async function loadRecurringEvidenceById(
  workspaceId: string,
  transactionIds: string[],
): Promise<Map<string, RecurringEvidenceTx>> {
  if (transactionIds.length === 0) {
    return new Map();
  }
  const uniqueIds = [...new Set(transactionIds)];
  const rows = await prisma.transaction.findMany({
    where: { workspaceId, id: { in: uniqueIds } },
    select: { id: true, bookedAt: true, amount: true, description: true },
    orderBy: { bookedAt: "desc" },
  });
  return new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        bookedAt: row.bookedAt.toISOString(),
        amount: row.amount.toString(),
        description: row.description,
      },
    ]),
  );
}
