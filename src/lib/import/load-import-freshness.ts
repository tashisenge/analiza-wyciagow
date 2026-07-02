import { prisma } from "@/lib/db";

export const STALE_IMPORT_DAYS = 14;

export async function loadImportFreshness(
  workspaceId: string,
): Promise<{ daysSinceImport: number | null; isStale: boolean }> {
  const batch = await prisma.importBatch.findFirst({
    where: { workspaceId },
    orderBy: { importedAt: "desc" },
    select: { importedAt: true },
  });

  if (!batch) {
    return { daysSinceImport: null, isStale: false };
  }

  const daysSinceImport = Math.floor(
    (Date.now() - batch.importedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    daysSinceImport,
    isStale: daysSinceImport > STALE_IMPORT_DAYS,
  };
}
