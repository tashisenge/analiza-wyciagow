import { redirect } from "next/navigation";

import { CategoriesView } from "@/components/categories/CategoriesView";
import { auth } from "@/lib/auth";
import { loadCategoryTransactionCounts } from "@/lib/categories/category-transaction-counts";
import { CANONICAL_CATEGORY_NAMES } from "@/lib/categories/default-categories";
import { ensureCanonicalCategories } from "@/lib/categories/ensure-canonical-categories";
import { prisma } from "@/lib/db";
import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";
import {
  createCategory,
  createRule,
  deleteCategory,
  deleteRule,
  setCategoryOptimizationExclusion,
} from "@/server/actions/categories";

async function createCategoryAction(formData: FormData): Promise<void> {
  "use server";
  const result = await createCategory(formData);
  if (!result.ok) {
    redirect(`/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/categories");
}

async function deleteCategoryAction(formData: FormData): Promise<void> {
  "use server";
  const id = formData.get("categoryId");
  if (typeof id !== "string") {
    redirect("/categories?error=Nieprawidłowa+kategoria");
  }
  const result = await deleteCategory(id);
  if (!result.ok) {
    redirect(`/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/categories");
}

async function createRuleAction(formData: FormData): Promise<void> {
  "use server";
  const result = await createRule(formData);
  if (!result.ok) {
    redirect(`/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/categories");
}

async function deleteRuleAction(formData: FormData): Promise<void> {
  "use server";
  const id = formData.get("ruleId");
  if (typeof id !== "string") {
    redirect("/categories?error=Nieprawidłowa+reguła");
  }
  const result = await deleteRule(id);
  if (!result.ok) {
    redirect(`/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/categories");
}

async function toggleOptimizationExclusionAction(
  categoryId: string,
  excludeFromOptimization: boolean,
): Promise<void> {
  "use server";
  const result = await setCategoryOptimizationExclusion(categoryId, excludeFromOptimization);
  if (!result.ok) {
    redirect(`/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/categories");
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const params = await searchParams;
  const workspaceId = session.user.workspaceId;

  await ensureCanonicalCategories(workspaceId);
  const categoryCount = await prisma.category.count({ where: { workspaceId } });
  if (categoryCount > CANONICAL_CATEGORY_NAMES.length + 2) {
    await assignMbankCategoriesForWorkspace(workspaceId);
  }

  const [categories, rules, transactionCounts] = await Promise.all([
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.categoryRule.findMany({
      where: { workspaceId },
      include: { category: true },
      orderBy: { priority: "desc" },
    }),
    loadCategoryTransactionCounts(workspaceId),
  ]);

  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    transactionCount: transactionCounts.get(category.id) ?? 0,
  }));

  return (
    <CategoriesView
      categories={categoriesWithCounts}
      rules={rules}
      error={params.error}
      createCategoryAction={createCategoryAction}
      deleteCategoryAction={deleteCategoryAction}
      createRuleAction={createRuleAction}
      deleteRuleAction={deleteRuleAction}
      toggleOptimizationExclusionAction={toggleOptimizationExclusionAction}
    />
  );
}
