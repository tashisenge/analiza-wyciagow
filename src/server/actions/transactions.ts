"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { scopedTransactionUpdate } from "@/lib/transactions/scoped-update";

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

async function rememberMerchantCategory(
  workspaceId: string,
  counterparty: string,
  categoryId: string,
): Promise<void> {
  if (!counterparty.trim()) {
    return;
  }
  await prisma.merchantCategoryMemory.upsert({
    where: { workspaceId_counterparty: { workspaceId, counterparty } },
    create: { workspaceId, counterparty, categoryId },
    update: { categoryId },
  });
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string,
): Promise<{ ok: boolean; error?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, workspaceId },
    });
    if (!transaction) {
      return { ok: false, error: "Nieznaleziono transakcji" };
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, workspaceId },
    });
    if (!category) {
      return { ok: false, error: "Nieprawidłowa kategoria" };
    }

    await prisma.transaction.update(
      scopedTransactionUpdate(workspaceId, transactionId, categoryId),
    );
    await rememberMerchantCategory(workspaceId, transaction.counterparty, categoryId);

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("transactions.updateCategory", error, {
        context: { workspaceId, transactionId },
        fallbackMessage: "Nie udało się zapisać kategorii",
      }),
    };
  }
}
