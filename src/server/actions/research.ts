"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { isResearchAvailable } from "@/lib/research/config";
import {
  ResearchError,
  runOpportunityResearch,
} from "@/lib/research/run-opportunity-research";
import type { ResearchResult } from "@/lib/research/types";

export type ResearchActionResult =
  | { ok: true; result: ResearchResult }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

export async function researchOpportunityAlternatives(
  opportunityId: string,
  forceRefresh = false,
): Promise<ResearchActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  if (!isResearchAvailable()) {
    return {
      ok: false,
      error: "Ustaw TAVILY_API_KEY oraz ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env",
    };
  }

  try {
    const result = await runOpportunityResearch(prisma, {
      workspaceId,
      opportunityId,
      forceRefresh,
    });
    revalidatePath("/optimize");
    return { ok: true, result };
  } catch (error) {
    if (error instanceof ResearchError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: logActionError("research.opportunity", error, {
        context: { workspaceId, opportunityId },
        fallbackMessage: "Błąd wyszukiwania alternatyw",
      }),
    };
  }
}
