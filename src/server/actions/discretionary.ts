"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import type { CategoryActionResult } from "@/server/actions/categories";

export type DiscretionaryActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const contextSchema = z.enum(["firma", "dom", "razem"]);

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

function revalidateDiscretionaryPaths(): void {
  revalidatePath("/opcjonalne");
  revalidatePath("/dashboard");
}

export async function setCategoryDiscretionary(
  categoryId: string,
  isDiscretionary: boolean,
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
      data: { isDiscretionary },
    });
    revalidatePath("/categories");
    revalidatePath("/opcjonalne");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("categories.setDiscretionary", error, {
        context: { categoryId, workspaceId },
      }),
    };
  }
}

export async function upsertDiscretionaryBudget(
  context: string,
  monthlyLimit: number,
): Promise<DiscretionaryActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsedContext = contextSchema.safeParse(context);
  if (!parsedContext.success) {
    return { ok: false, error: "Nieprawidłowy kontekst konta" };
  }
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0 || monthlyLimit > 999_999) {
    return { ok: false, error: "Limit musi być między 1 a 999 999 PLN" };
  }

  try {
    await prisma.discretionaryBudget.upsert({
      where: {
        workspaceId_accountContext: {
          workspaceId,
          accountContext: parsedContext.data,
        },
      },
      create: {
        workspaceId,
        accountContext: parsedContext.data,
        monthlyLimit,
      },
      update: { monthlyLimit },
    });
    revalidateDiscretionaryPaths();
    return { ok: true, message: "Limit zapisany." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("discretionary.budget", error, {
        context: { workspaceId },
        fallbackMessage: "Nie udało się zapisać limitu",
      }),
    };
  }
}
