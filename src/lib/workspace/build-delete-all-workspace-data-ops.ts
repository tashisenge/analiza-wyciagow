import type { PrismaClient } from "@prisma/client";

/**
 * Destructive ops for Settings → „Usuń wszystkie transakcje”.
 * Removes ledger + derived analysis; preserves categories, rules, merchant memory,
 * budgets, tags, accounts, and members (matches settings copy).
 */
export async function runDeleteAllWorkspaceData(
  db: PrismaClient,
  workspaceId: string,
): Promise<void> {
  await db.$transaction([
    db.transaction.deleteMany({ where: { workspaceId } }),
    db.importBatch.deleteMany({ where: { workspaceId } }),
    db.optimizationOpportunity.deleteMany({ where: { workspaceId } }),
    db.subscriptionMarker.deleteMany({ where: { workspaceId } }),
    db.aiInsight.deleteMany({ where: { workspaceId } }),
    db.workspace.update({
      where: { id: workspaceId },
      data: { lastAiInsight: null, lastAiInsightAt: null },
    }),
  ]);
}

/** Models wiped (derived / ledger). OpportunityResearch cascades from opportunities. */
export const WORKSPACE_WIPE_DELETED_MODELS = [
  "transaction",
  "importBatch",
  "optimizationOpportunity",
  "subscriptionMarker",
  "aiInsight",
] as const;

/** Models that must NOT be wiped (configuration the UI promises to keep). */
export const WORKSPACE_WIPE_PRESERVED_MODELS = [
  "category",
  "categoryRule",
  "merchantCategoryMemory",
  "categoryBudget",
  "discretionaryBudget",
  "tag",
  "account",
  "workspaceMember",
] as const;
