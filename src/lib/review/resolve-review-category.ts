import { prisma } from "@/lib/db";
import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";
import { mapMbankCategoryToAppName } from "@/lib/mbank-category-map";

export type ReviewDecision = "mbank" | "app" | "custom" | "skip";

interface ReviewTransaction {
  mbankCategory: string;
  categoryId: string | null;
}

interface ResolveReviewCategoryInput {
  workspaceId: string;
  tx: ReviewTransaction;
  decision: ReviewDecision;
  customCategoryId?: string;
}

async function resolveMbankCategoryId(
  workspaceId: string,
  mbankCategory: string,
): Promise<{ ok: true; categoryId: string } | { ok: false; error: string }> {
  const appName = mapMbankCategoryToAppName(mbankCategory);
  if (!appName) {
    const mbankName = normalizeMbankCategoryName(mbankCategory);
    if (!mbankName) {
      return { ok: false, error: "mBank nie ma sensownej kategorii" };
    }
    return { ok: false, error: `Brak kategorii «${mbankName}» w app` };
  }
  const category = await prisma.category.findFirst({
    where: { workspaceId, name: appName },
  });
  if (!category) {
    return { ok: false, error: `Brak kategorii «${appName}» w app` };
  }
  return { ok: true, categoryId: category.id };
}

async function resolveCustomCategoryId(
  workspaceId: string,
  customCategoryId?: string,
): Promise<{ ok: true; categoryId: string } | { ok: false; error: string }> {
  if (!customCategoryId) {
    return { ok: false, error: "Wybierz kategorię" };
  }
  const category = await prisma.category.findFirst({
    where: { id: customCategoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nieprawidłowa kategoria" };
  }
  return { ok: true, categoryId: category.id };
}

export async function resolveReviewCategoryId(
  input: ResolveReviewCategoryInput,
): Promise<{ ok: true; categoryId: string | null } | { ok: false; error: string }> {
  if (input.decision === "skip") {
    return { ok: true, categoryId: null };
  }
  if (input.decision === "mbank") {
    return resolveMbankCategoryId(input.workspaceId, input.tx.mbankCategory);
  }
  if (input.decision === "app") {
    if (!input.tx.categoryId) {
      return { ok: false, error: "Brak kategorii app do zaakceptowania" };
    }
    return { ok: true, categoryId: input.tx.categoryId };
  }
  return resolveCustomCategoryId(input.workspaceId, input.customCategoryId);
}
