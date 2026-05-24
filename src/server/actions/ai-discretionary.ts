"use server";

import { revalidatePath } from "next/cache";

import type { AiActionResult } from "./ai";

import type { DiscretionaryInsightRequestParams } from "@/lib/ai/discretionary-insight-types";
import { parseDiscretionaryInsightParams } from "@/lib/ai/parse-discretionary-insight-params";
import { getAiConfigForWorkspace } from "@/lib/ai/resolve-workspace-ai";
import { runGenerateDiscretionaryInsight } from "@/lib/ai/run-generate-discretionary-insight";
import { auth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";


export async function aiGenerateDiscretionaryInsight(
  params: DiscretionaryInsightRequestParams,
): Promise<AiActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Brak sesji" };
  }

  const workspaceId = session.user.workspaceId;
  const config = await getAiConfigForWorkspace(workspaceId);
  if (!config) {
    return { ok: false, error: "Brak klucza API w .env" };
  }

  const { context, range } = parseDiscretionaryInsightParams(params);

  try {
    const result = await runGenerateDiscretionaryInsight({
      workspaceId,
      context,
      range,
      config,
    });
    revalidatePath("/opcjonalne");
    return { ok: true, message: result.message, insight: result.insight };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.discretionaryInsight", error, {
        context: { workspaceId, provider: config.provider },
        fallbackMessage: "Błąd raportu AI o wydatkach opcjonalnych",
      }),
    };
  }
}
