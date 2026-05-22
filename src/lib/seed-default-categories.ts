export const DEFAULT_CATEGORIES = [
  { name: "Żywność", color: "#22c55e" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Mieszkanie", color: "#a855f7" },
  { name: "Rozrywka", color: "#f97316" },
  { name: "Zdrowie", color: "#ec4899" },
  { name: "KUP (firma)", color: "#64748b" },
  { name: "ZUS (firma)", color: "#475569" },
  { name: "Przychód", color: "#10b981" },
  { name: "Inne", color: "#94a3b8" },
] as const;

export async function seedCategoriesForWorkspace(
  workspaceId: string,
  createCategory: (data: {
    workspaceId: string;
    name: string;
    color: string;
    isDefault: boolean;
  }) => Promise<unknown>,
): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await createCategory({
      workspaceId,
      name: category.name,
      color: category.color,
      isDefault: true,
    });
  }
}
