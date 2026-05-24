"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";
import {
  resolveBulkAccountIds,
  resolveBulkTargetIds,
} from "@/lib/transactions/bulk-category-targets";
import {
  type BulkCategoryFilters,
  type BulkCategoryPreviewResult,
} from "@/lib/transactions/bulk-category-types";
import { executeBulkCategoryUpdate } from "@/lib/transactions/execute-bulk-category-update";
import {
  bulkUpdateSchema,
  validateBulkUpdateInput,
} from "@/lib/transactions/validate-bulk-update";

export type BulkCategoryActionResult =
  | { ok: true; updatedCount: number; rememberedMerchants: number }
  | { ok: false; error: string };

export type BulkPreviewActionResult =
  | { ok: true; preview: BulkCategoryPreviewResult }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

export async function previewBulkCategoryUpdate(
  filters: BulkCategoryFilters,
): Promise<BulkPreviewActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const accountIds = await resolveBulkAccountIds(workspaceId, filters.context);
    const total = await prisma.transaction.count({
      where: buildBulkCategoryWhere({ workspaceId, accountIds, filters }),
    });
    const ids = await resolveBulkTargetIds({ workspaceId, accountIds, filters });
    return {
      ok: true,
      preview: { count: total, capped: total > 500, sampleIds: ids.slice(0, 5) },
    };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("bulkCategory.preview", error, { context: { workspaceId } }),
    };
  }
}

export async function bulkUpdateCategory(input: {
  categoryId: string;
  rememberMerchant?: boolean;
  transactionIds?: string[];
  filters?: BulkCategoryFilters;
}): Promise<BulkCategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = bulkUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const validated = await validateBulkUpdateInput(workspaceId, parsed.data);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  try {
    const result = await executeBulkCategoryUpdate({
      prisma,
      workspaceId,
      categoryId: parsed.data.categoryId,
      rememberMerchant: parsed.data.rememberMerchant,
      filters: validated.filters,
      transactionIds: parsed.data.transactionIds,
    });
    return { ok: true, ...result };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Brak transakcji spełniających kryteria"
        ? error.message
        : logActionError("bulkCategory.update", error, { context: { workspaceId } });
    return { ok: false, error: message };
  }
}
