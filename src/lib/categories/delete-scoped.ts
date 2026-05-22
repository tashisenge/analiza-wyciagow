/**
 * Filtry Prisma ograniczone do workspace (obrona przed IDOR).
 * Używaj przy updateMany/deleteMany na Transaction, CategoryRule, MerchantCategoryMemory —
 * samo `categoryId` nie wystarcza (ID kategorii nie jest globalnie unikalne między workspace).
 */
export function scopedCategoryId(
  workspaceId: string,
  categoryId: string,
): { workspaceId: string; categoryId: string } {
  return { workspaceId, categoryId };
}

export function scopedCategoryPrimaryKey(
  workspaceId: string,
  categoryId: string,
): { id: string; workspaceId: string } {
  return { id: categoryId, workspaceId };
}
