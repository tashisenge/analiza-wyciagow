"use server";

import type { Transaction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { findSimilarTransactionIds } from "@/lib/transactions/find-similar-transaction-ids";
import { isTransactionInCandidateScope } from "@/lib/transactions/scoped-update";
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
  amount: string;
  currency: string;
  applyToSimilar: boolean;
  matchSameAmount: boolean;
  candidateTransactionIds: string[];
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
    candidateTransactionIds: options.candidateTransactionIds,
    onlyUncategorized: false,
    amount: options.amount,
    currency: options.currency,
    matchSameAmount: options.matchSameAmount,
  });
}

interface ApplyCategoryOptions {
  workspaceId: string;
  idsToUpdate: string[];
  categoryId: string | null;
  counterparty: string;
  createRule: boolean;
}

async function applyCategoryToTransactions(options: ApplyCategoryOptions): Promise<void> {
  await prisma.transaction.updateMany({
    where: { workspaceId: options.workspaceId, id: { in: options.idsToUpdate } },
    data: { categoryId: options.categoryId },
  });
  if (!options.categoryId) {
    return;
  }
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

async function loadTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<Transaction | null> {
  return prisma.transaction.findFirst({
    where: { id: transactionId, workspaceId },
  });
}

async function validateCategoryId(
  workspaceId: string,
  categoryId: string,
): Promise<string | null> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, workspaceId },
    select: { id: true },
  });
  if (!category) {
    return "Nieprawidłowa kategoria";
  }
  return null;
}

function revalidateCategoryPaths(): void {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/categories");
}

export interface UpdateCategoryOptions {
  applyToSimilar?: boolean;
  matchSameAmount?: boolean;
  createRule?: boolean;
  candidateTransactionIds?: string[];
}

interface PerformCategoryUpdateInput {
  workspaceId: string;
  transaction: Transaction;
  categoryId: string | null;
  options?: UpdateCategoryOptions;
}

async function performCategoryUpdate(
  input: PerformCategoryUpdateInput,
): Promise<{ updatedCount: number }> {
  const clearing = !input.categoryId;
  const similarIds = await collectSimilarIds({
    workspaceId: input.workspaceId,
    transactionId: input.transaction.id,
    counterparty: input.transaction.counterparty,
    amount: input.transaction.amount.toString(),
    currency: input.transaction.currency,
    applyToSimilar: input.options?.applyToSimilar ?? false,
    matchSameAmount: input.options?.matchSameAmount ?? false,
    candidateTransactionIds: input.options?.candidateTransactionIds ?? [],
  });
  const idsToUpdate = [input.transaction.id, ...similarIds];
  await applyCategoryToTransactions({
    workspaceId: input.workspaceId,
    idsToUpdate,
    categoryId: input.categoryId,
    counterparty: input.transaction.counterparty,
    createRule: clearing ? false : (input.options?.createRule ?? false),
  });
  return { updatedCount: idsToUpdate.length };
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
  if (!isTransactionInCandidateScope(transactionId, options?.candidateTransactionIds)) {
    return { ok: false, error: "Transakcja nie należy do bieżącej strony" };
  }
  const clearing = !categoryId.trim();
  try {
    const transaction = await loadTransaction(workspaceId, transactionId);
    if (!transaction) {
      return { ok: false, error: "Nieznaleziono transakcji" };
    }

    const categoryError = clearing
      ? null
      : await validateCategoryId(workspaceId, categoryId);
    if (categoryError) {
      return { ok: false, error: categoryError };
    }

    const result = await performCategoryUpdate({
      workspaceId,
      transaction,
      categoryId: clearing ? null : categoryId,
      options,
    });

    revalidateCategoryPaths();
    return { ok: true, updatedCount: result.updatedCount };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("transactions.updateCategory", error, {
        context: { workspaceId, transactionId },
        fallbackMessage: clearing
          ? "Nie udało się usunąć kategorii"
          : "Nie udało się zapisać kategorii",
      }),
    };
  }
}
