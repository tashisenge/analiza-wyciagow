"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { refreshWorkspaceOpportunities } from "@/lib/optimization/load-optimization-data";

export type OptimizationActionResult =
  | { ok: true; message: string; count?: number }
  | { ok: false; error: string };

const contextSchema = z.enum(["firma", "dom", "razem"]);
const statusSchema = z.enum(["OPEN", "ACKNOWLEDGED", "IMPLEMENTED", "DISMISSED"]);

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

function revalidateOptimizationPages(): void {
  revalidatePath("/optimize");
  revalidatePath("/dashboard");
}

export async function refreshOptimizationOpportunities(
  context: string,
): Promise<OptimizationActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const parsed = contextSchema.safeParse(context);
  if (!parsed.success) {
    return { ok: false, error: "Nieprawidłowy kontekst konta" };
  }

  try {
    const count = await refreshWorkspaceOpportunities(workspaceId, parsed.data);
    revalidateOptimizationPages();
    return {
      ok: true,
      message: `Odświeżono ${String(count)} możliwości optymalizacji.`,
      count,
    };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("optimization.refresh", error, {
        context: { workspaceId },
        fallbackMessage: "Błąd odświeżania możliwości",
      }),
    };
  }
}

export async function updateOpportunityStatus(
  opportunityId: string,
  status: string,
  followUpNote?: string,
): Promise<OptimizationActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { ok: false, error: "Nieprawidłowy status" };
  }

  const resolvedAt =
    parsedStatus.data === "IMPLEMENTED" || parsedStatus.data === "DISMISSED"
      ? new Date()
      : null;

  try {
    const updated = await prisma.optimizationOpportunity.updateMany({
      where: { id: opportunityId, workspaceId },
      data: {
        status: parsedStatus.data,
        followUpNote: followUpNote ?? null,
        resolvedAt,
      },
    });
    if (updated.count === 0) {
      return { ok: false, error: "Nie znaleziono możliwości" };
    }
    revalidateOptimizationPages();
    return { ok: true, message: "Status zaktualizowany." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("optimization.status", error, {
        context: { workspaceId, opportunityId },
        fallbackMessage: "Błąd aktualizacji statusu",
      }),
    };
  }
}

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  accountContext: contextSchema,
  monthlyLimit: z.number().positive(),
});

export async function upsertCategoryBudget(
  categoryId: string,
  accountContext: string,
  monthlyLimit: number,
): Promise<OptimizationActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const parsed = budgetSchema.safeParse({ categoryId, accountContext, monthlyLimit });
  if (!parsed.success) {
    return { ok: false, error: "Nieprawidłowe dane budżetu" };
  }

  try {
    await prisma.categoryBudget.upsert({
      where: {
        workspaceId_categoryId_accountContext: {
          workspaceId,
          categoryId: parsed.data.categoryId,
          accountContext: parsed.data.accountContext,
        },
      },
      create: {
        workspaceId,
        categoryId: parsed.data.categoryId,
        accountContext: parsed.data.accountContext,
        monthlyLimit: parsed.data.monthlyLimit,
      },
      update: { monthlyLimit: parsed.data.monthlyLimit },
    });
    revalidateOptimizationPages();
    return { ok: true, message: "Budżet zapisany." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("optimization.budget", error, {
        context: { workspaceId },
        fallbackMessage: "Błąd zapisu budżetu",
      }),
    };
  }
}

export async function deleteCategoryBudget(
  budgetId: string,
): Promise<OptimizationActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const deleted = await prisma.categoryBudget.deleteMany({
      where: { id: budgetId, workspaceId },
    });
    if (deleted.count === 0) {
      return { ok: false, error: "Nie znaleziono budżetu" };
    }
    revalidateOptimizationPages();
    return { ok: true, message: "Budżet usunięty." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("optimization.budgetDelete", error, {
        context: { workspaceId },
        fallbackMessage: "Błąd usuwania budżetu",
      }),
    };
  }
}
