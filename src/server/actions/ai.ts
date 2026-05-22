"use server";

import { revalidatePath } from "next/cache";

import { findAiCategorizationTargets } from "@/lib/ai/ai-target-transactions";
import { getAiConfig } from "@/lib/ai/config";
import { generateSpendingInsights } from "@/lib/ai/generate-insights";
import { loadInsightTransactions } from "@/lib/ai/load-insight-transactions";
import { buildMonthlySummary } from "@/lib/ai/monthly-summary";
import { categorizeUncategorizedWithAi } from "@/lib/ai/run-categorization";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { assignMbankCategoriesForWorkspace } from "@/lib/mbank/sync-categories";

export type AiActionResult =
  | { ok: true; message: string; categorized?: number; insight?: string }
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
  const config = getAiConfig();
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
    message: `AI przypisało kategorie do ${String(total)} z ${String(targetCount)} kwalifikujących się transakcji (max 100 na raz).`,
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

export async function aiGenerateInsights(
  contextParam = "razem",
): Promise<AiActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const config = getAiConfig();
  if (!config) {
    return { ok: false, error: "Brak klucza API w .env" };
  }

  try {
    const { transactions, periodLabel } = await loadInsightTransactions(
      workspaceId,
      contextParam,
    );
    const summary = buildMonthlySummary(transactions, periodLabel);
    const insight = await generateSpendingInsights(config, summary);
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { lastAiInsight: insight, lastAiInsightAt: new Date() },
    });
    revalidateFinancePages();
    return { ok: true, message: "Analiza wygenerowana i zapisana.", insight };
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
