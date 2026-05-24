"use server";

import { revalidatePath } from "next/cache";

import { findAiCategorizationTargets } from "@/lib/ai/ai-target-transactions";
import { describeAiCategorization } from "@/lib/ai/describe-ai-categorization";
import { getAiConfigForWorkspace } from "@/lib/ai/resolve-workspace-ai";
import { categorizeUncategorizedWithAi } from "@/lib/ai/run-categorization";
import { runGenerateInsight } from "@/lib/ai/run-generate-insight";
import { accountIdsForContext } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";

export type AiActionResult =
  | { ok: true; message: string; categorized?: number; insight?: string }
  | { ok: false; error: string };

export type AiCategorizePreviewResult =
  | {
      ok: true;
      description: ReturnType<typeof describeAiCategorization>;
    }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

function buildCategoryMaps(categories: { id: string; name: string }[]): {
  byName: Map<string, string>;
  names: string[];
} {
  const byName = new Map(categories.map((category) => [category.name, category.id]));
  return { byName, names: categories.map((category) => category.name) };
}

function revalidateFinancePages(): void {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/settings");
  revalidatePath("/opcjonalne");
}

export async function applyMbankMapping(): Promise<AiActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const updated = await assignMbankCategoriesForWorkspace(workspaceId);
    revalidateFinancePages();
    return {
      ok: true,
      message: `Przypisano ${String(updated)} transakcji do kategorii mBank (1:1).`,
      categorized: updated,
    };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.mbankMapping", error, {
        context: { workspaceId },
        fallbackMessage: "Błąd mapowania mBank",
      }),
    };
  }
}

async function runAiCategorize(workspaceId: string): Promise<AiActionResult> {
  const config = await getAiConfigForWorkspace(workspaceId);
  if (!config) {
    return {
      ok: false,
      error: "Brak klucza API. Ustaw ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env",
    };
  }

  const categories = await prisma.category.findMany({ where: { workspaceId } });
  const { byName, names } = buildCategoryMaps(categories);

  const { transactions: uncategorized, count: targetCount } =
    await findAiCategorizationTargets(workspaceId);

  if (uncategorized.length === 0) {
    return {
      ok: true,
      message:
        "Brak transakcji do kategoryzacji AI (wszystkie mają sensowną kategorię poza «Bez kategorii»).",
      categorized: 0,
    };
  }

  const total = await categorizeUncategorizedWithAi({
    config,
    workspaceId,
    uncategorized,
    categoryNames: names,
    byName,
  });
  revalidateFinancePages();
  return {
    ok: true,
    message: `AI (${config.provider}) przypisało kategorie do ${String(total)} z ${String(targetCount)} transakcji (max 100 na raz).`,
    categorized: total,
  };
}

export async function aiCategorizeUncategorized(): Promise<AiActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    return await runAiCategorize(workspaceId);
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.categorize", error, {
        context: { workspaceId },
        fallbackMessage: "Błąd kategoryzacji AI",
      }),
    };
  }
}

export async function getAiCategorizePreview(): Promise<AiCategorizePreviewResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const { transactions, count } = await findAiCategorizationTargets(workspaceId, 5);
  return {
    ok: true,
    description: describeAiCategorization(
      count,
      transactions.map((tx) => ({
        counterparty: tx.counterparty,
        description: tx.description,
        amount: tx.amount.toString(),
        mbankCategory: tx.mbankCategory,
      })),
    ),
  };
}

export async function aiGenerateInsights(
  contextParam = "razem",
): Promise<AiActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const config = await getAiConfigForWorkspace(workspaceId);
  if (!config) {
    return { ok: false, error: "Brak klucza API w .env" };
  }

  const context =
    contextParam === "firma" || contextParam === "dom" ? contextParam : "razem";

  try {
    const accounts = await prisma.account.findMany({ where: { workspaceId } });
    const accountIds = accountIdsForContext(accounts, context);
    const result = await runGenerateInsight({
      workspaceId,
      context,
      accountIds,
      config,
    });
    revalidateFinancePages();
    return { ok: true, message: result.message, insight: result.insight };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.insights", error, {
        context: { workspaceId, provider: config.provider },
        fallbackMessage: "Błąd analizy AI",
      }),
    };
  }
}
