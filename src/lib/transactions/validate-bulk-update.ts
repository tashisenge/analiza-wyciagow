import { z } from "zod";

import { prisma } from "@/lib/db";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";
import { hasBulkSelection } from "@/lib/transactions/has-bulk-selection";

const filtersSchema = z.object({
  counterpartyContains: z.string().optional(),
  mbankCategory: z.string().optional(),
  uncategorizedOnly: z.boolean().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  tagId: z.string().optional(),
  discretionary: z.boolean().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  context: z.enum(["firma", "dom", "razem"]).optional(),
});

export const bulkUpdateSchema = z.object({
  categoryId: z.string().min(1, "Wybierz kategorię"),
  rememberMerchant: z.boolean().default(false),
  transactionIds: z.array(z.string()).optional(),
  filters: filtersSchema.optional(),
});

export async function validateBulkUpdateInput(
  workspaceId: string,
  input: z.infer<typeof bulkUpdateSchema>,
): Promise<{ ok: true; filters: BulkCategoryFilters } | { ok: false; error: string }> {
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nieprawidłowa kategoria" };
  }

  const filters = input.filters ?? {};
  if (!hasBulkSelection(input.transactionIds, filters)) {
    return { ok: false, error: "Ustaw filtr lub zaznacz transakcje" };
  }

  return { ok: true, filters };
}
