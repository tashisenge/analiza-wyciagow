import { z } from "zod";

import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import { buildMbankVerifySystemPrompt } from "@/lib/ai/prompts/mbank-verify";
import { logger } from "@/lib/logger";

export interface MbankVerifySuggestion {
  recommendedCategory: string;
  reason: string;
  prefer: "mbank" | "app";
}

const responseSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      recommendedCategory: z.string(),
      reason: z.string(),
      prefer: z.enum(["mbank", "app"]),
    }),
  ),
});

export function parseMbankVerifyResponse(
  raw: string,
  validCategoryNames: Set<string>,
): Map<string, MbankVerifySuggestion> {
  const jsonPattern = /\{[\s\S]*\}/;
  const jsonMatch = jsonPattern.exec(raw);
  if (!jsonMatch) {
    logger.error("ai.mbankVerify.parse", { context: { reason: "no_json" } });
    throw new Error("AI: brak JSON w odpowiedzi");
  }
  const parsed = responseSchema.parse(JSON.parse(jsonMatch[0]));
  const result = new Map<string, MbankVerifySuggestion>();
  for (const item of parsed.suggestions) {
    if (!validCategoryNames.has(item.recommendedCategory)) {
      continue;
    }
    result.set(item.id, {
      recommendedCategory: item.recommendedCategory,
      reason: item.reason,
      prefer: item.prefer,
    });
  }
  return result;
}

export interface TransactionForMbankVerify {
  id: string;
  description: string;
  counterparty: string;
  amount: string;
  mbankCategory: string;
  appCategoryName: string | null;
}

export async function verifyMbankAssignmentsWithAi(options: {
  config: AiConfig;
  transactions: TransactionForMbankVerify[];
  categoryNames: string[];
  fetchFn?: FetchFn;
}): Promise<Map<string, MbankVerifySuggestion>> {
  const rows = options.transactions.map((tx) => ({
    id: tx.id,
    kontrahent: tx.counterparty,
    opis: tx.description.slice(0, 120),
    kwota: tx.amount,
    kategoria_mbank: tx.mbankCategory,
    kategoria_app: tx.appCategoryName,
  }));
  const raw = await completeWithAi(
    options.config,
    {
      system: buildMbankVerifySystemPrompt(options.categoryNames),
      user: `Zweryfikuj przypisania:\n${JSON.stringify(rows)}`,
      maxTokens: 4096,
    },
    options.fetchFn,
  );
  return parseMbankVerifyResponse(raw, new Set(options.categoryNames));
}
