"use server";

import type { Category, Transaction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { findSimilarTransactionIds } from "@/lib/transactions/find-similar-transaction-ids";
import { upsertCounterpartyRule } from "@/lib/transactions/upsert-counterparty-rule";

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

interface CollectSimilarIdsOptions {
  workspaceId: string;
  transactionId: string;
  counterparty: string;
  applyToSimilar: boolean;
}

async function collectSimilarIds(options: CollectSimilarIdsOptions): Promise<string[]> {
  if (!options.applyToSimilar) {
    return [];
  }
  return findSimilarTransactionIds({
    prisma,
    workspaceId: options.workspaceId,
    counterparty: options.counterparty,
    excludeTransactionId: options.transactionId,
    onlyUncategorized: true,
  });
}

interface PersistCategoryAssignmentOptions {
  workspaceId: string;
  idsToUpdate: string[];
  categoryId: string;
  counterparty: string;
  createRule: boolean;
}

async function persistCategoryAssignment(
  options: PersistCategoryAssignmentOptions,
): Promise<void> {
  await prisma.transaction.updateMany({
    where: { workspaceId: options.workspaceId, id: { in: options.idsToUpdate } },
    data: { categoryId: options.categoryId },
  });
  await rememberMerchantCategory(
    options.workspaceId,
    options.counterparty,
    options.categoryId,
  );
  if (!options.createRule) {
    return;
  }
  await upsertCounterpartyRule({
    prisma,
    workspaceId: options.workspaceId,
    categoryId: options.categoryId,
    counterparty: options.counterparty,
  });
}

interface CategoryUpdateTarget {
  transaction: Transaction;
  category: Category;
}

async function loadCategoryUpdateTarget(
  workspaceId: string,
  transactionId: string,
  categoryId: string,
): Promise<{ ok: true; data: CategoryUpdateTarget } | { ok: false; error: string }> {
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

  return { ok: true, data: { transaction, category } };
}

export interface UpdateCategoryOptions {
  applyToSimilar?: boolean;
  createRule?: boolean;
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string,
  options?: UpdateCategoryOptions,
): Promise<{ ok: boolean; error?: string; updatedCount?: number }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const target = await loadCategoryUpdateTarget(workspaceId, transactionId, categoryId);
    if (!target.ok) {
      return { ok: false, error: target.error };
    }

    const similarIds = await collectSimilarIds({
      workspaceId,
      transactionId,
      counterparty: target.data.transaction.counterparty,
      applyToSimilar: options?.applyToSimilar ?? false,
    });
    const idsToUpdate = [transactionId, ...similarIds];
    await persistCategoryAssignment({
      workspaceId,
      idsToUpdate,
      categoryId,
      counterparty: target.data.transaction.counterparty,
      createRule: options?.createRule ?? false,
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/categories");
    return { ok: true, updatedCount: idsToUpdate.length };
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
