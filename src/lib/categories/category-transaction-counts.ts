import { prisma } from "@/lib/db";

export async function loadCategoryTransactionCounts(
  workspaceId: string,
): Promise<Map<string, number>> {
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { workspaceId, categoryId: { not: null } },
    _count: { _all: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.categoryId) {
      counts.set(row.categoryId, row._count._all);
    }
  }
  return counts;
}

export function formatCategoryTransactionCount(count: number): string {
  if (count === 1) {
    return "1 transakcja";
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${String(count)} transakcje`;
  }
  return `${String(count)} transakcji`;
}
