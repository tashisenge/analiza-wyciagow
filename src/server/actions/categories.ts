"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  scopedCategoryId,
  scopedCategoryPrimaryKey,
} from "@/lib/categories/delete-scoped";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { colorForMbankCategory } from "@/lib/mbank/category-colors";

export type CategoryActionResult = { ok: true } | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Podaj nazwę"),
  color: z.string().optional(),
});

export async function createCategory(formData: FormData): Promise<CategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await prisma.category.create({
      data: {
        workspaceId,
        name: parsed.data.name,
        color: parsed.data.color ?? colorForMbankCategory(parsed.data.name),
        isDefault: false,
      },
    });
    revalidatePath("/categories");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.create", error, { context: { workspaceId } }),
    };
  }
}

export async function deleteCategory(categoryId: string): Promise<CategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nie znaleziono kategorii" };
  }
  if (category.isDefault) {
    return { ok: false, error: "Nie można usunąć kategorii domyślnej" };
  }

  try {
    const scope = scopedCategoryId(workspaceId, categoryId);
    await prisma.transaction.updateMany({
      where: scope,
      data: { categoryId: null },
    });
    await prisma.categoryRule.deleteMany({ where: scope });
    await prisma.merchantCategoryMemory.deleteMany({ where: scope });
    await prisma.category.deleteMany({
      where: scopedCategoryPrimaryKey(workspaceId, categoryId),
    });
    revalidatePath("/categories");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.delete", error, {
        context: { categoryId, workspaceId },
      }),
    };
  }
}

export async function setCategoryOptimizationExclusion(
  categoryId: string,
  excludeFromOptimization: boolean,
): Promise<CategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nie znaleziono kategorii" };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: { excludeFromOptimization },
    });
    revalidatePath("/categories");
    revalidatePath("/optimize");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.setOptimizationExclusion", error, {
        context: { categoryId, workspaceId },
      }),
    };
  }
}

const createRuleSchema = z.object({
  categoryId: z.string().min(1),
  matchField: z.enum(["description", "counterparty"]),
  matchContains: z.string().trim().min(1, "Podaj fragment tekstu"),
  priority: z.coerce.number().int().default(0),
});

export async function createRule(formData: FormData): Promise<CategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = createRuleSchema.safeParse({
    categoryId: formData.get("categoryId"),
    matchField: formData.get("matchField"),
    matchContains: formData.get("matchContains"),
    priority: formData.get("priority") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, workspaceId },
  });
  if (!category) {
    return { ok: false, error: "Nieprawidłowa kategoria" };
  }

  try {
    await prisma.categoryRule.create({
      data: { workspaceId, ...parsed.data },
    });
    revalidatePath("/categories");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.createRule", error, { context: { workspaceId } }),
    };
  }
}

export async function deleteRule(ruleId: string): Promise<CategoryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    await prisma.categoryRule.deleteMany({ where: { id: ruleId, workspaceId } });
    revalidatePath("/categories");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.deleteRule", error, { context: { ruleId } }),
    };
  }
}
