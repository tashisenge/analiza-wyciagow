"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAiConfigForWorkspace } from "@/lib/ai/resolve-workspace-ai";
import { runMbankVerifyBatch } from "@/lib/ai/run-mbank-verify-batch";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { countReviewQueue, loadReviewQueue } from "@/lib/review/load-review-queue";
import { persistReviewDecision } from "@/lib/review/persist-review-decision";
import type { ReviewQueueFilters } from "@/lib/review/review-queue-filters";

export type ReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type AiVerifyBatchResult =
  | { ok: true; suggestions: Record<string, MbankVerifySuggestion> }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const decisionSchema = z.object({
  transactionId: z.string().min(1),
  decision: z.enum(["mbank", "app", "custom", "skip"]),
  categoryId: z.string().optional(),
});

function revalidateReviewPaths(): void {
  revalidatePath("/review");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function getReviewQueueCount(): Promise<number> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return 0;
  }
  return countReviewQueue(workspaceId);
}

export async function aiVerifyReviewBatch(
  page = 1,
  filters: ReviewQueueFilters = {},
): Promise<AiVerifyBatchResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const config = await getAiConfigForWorkspace(workspaceId);
  if (!config) {
    return {
      ok: false,
      error: "Brak klucza API. Ustaw ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env",
    };
  }

  try {
    const { items } = await loadReviewQueue(workspaceId, page, filters);
    if (items.length === 0) {
      return { ok: false, error: "Kolejka weryfikacji jest pusta" };
    }

    const categories = await prisma.category.findMany({ where: { workspaceId } });
    const suggestions = await runMbankVerifyBatch({
      config,
      items,
      categoryNames: categories.map((category) => category.name),
    });

    const record: Record<string, MbankVerifySuggestion> = {};
    for (const [id, suggestion] of suggestions) {
      record[id] = suggestion;
    }

    return { ok: true, suggestions: record };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("review.aiVerifyBatch", error, { context: { workspaceId } }),
    };
  }
}

export async function applyReviewDecision(input: {
  transactionId: string;
  decision: "mbank" | "app" | "custom" | "skip";
  categoryId?: string;
}): Promise<ReviewActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  if (parsed.data.decision === "skip") {
    return { ok: true, message: "Pominięto" };
  }

  try {
    const result = await persistReviewDecision({
      workspaceId,
      transactionId: parsed.data.transactionId,
      decision: parsed.data.decision,
      categoryId: parsed.data.categoryId,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    revalidateReviewPaths();
    return { ok: true, message: "Zapisano decyzję" };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("review.applyDecision", error, {
        context: { workspaceId, transactionId: parsed.data.transactionId },
      }),
    };
  }
}
