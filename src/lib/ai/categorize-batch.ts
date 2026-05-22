import { z } from "zod";

import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import { buildCategorizationSystemPrompt } from "@/lib/ai/prompts/categorization";
import { logger } from "@/lib/logger";

export interface TransactionForAi {
  id: string;
  description: string;
  counterparty: string;
  amount: string;
  mbankCategory: string;
}

const responseSchema = z.object({
  assignments: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
    }),
  ),
});

function buildUserPrompt(transactions: TransactionForAi[]): string {
  const rows = transactions.map((tx) => ({
    id: tx.id,
    kontrahent: tx.counterparty,
    opis: tx.description.slice(0, 120),
    kwota: tx.amount,
    kategoria_mbank: tx.mbankCategory,
  }));
  return `Przypisz kategorie dla transakcji:\n${JSON.stringify(rows, null, 0)}`;
}

export function parseCategorizationResponse(
  raw: string,
  validCategoryNames: Set<string>,
): Map<string, string> {
  const jsonPattern = /\{[\s\S]*\}/;
  const jsonMatch = jsonPattern.exec(raw);
  if (!jsonMatch) {
    logger.error("ai.categorize.parse", {
      context: { reason: "no_json", preview: raw.slice(0, 200) },
    });
    throw new Error("AI: brak JSON w odpowiedzi");
  }
  let parsed;
  try {
    parsed = responseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch (error) {
    logger.error("ai.categorize.parse", { context: { reason: "invalid_schema" }, error });
    throw error;
  }
  const result = new Map<string, string>();
  for (const item of parsed.assignments) {
    if (validCategoryNames.has(item.category)) {
      result.set(item.id, item.category);
    }
  }
  return result;
}

export interface CategorizeBatchOptions {
  config: AiConfig;
  transactions: TransactionForAi[];
  categoryNames: string[];
  fetchFn?: FetchFn;
}

export async function categorizeBatchWithAi(
  options: CategorizeBatchOptions,
): Promise<Map<string, string>> {
  const { config, transactions, categoryNames, fetchFn } = options;
  if (transactions.length === 0) {
    return new Map();
  }
  const validNames = new Set(categoryNames);
  const raw = await completeWithAi(
    config,
    {
      system: buildCategorizationSystemPrompt(categoryNames),
      user: buildUserPrompt(transactions),
      maxTokens: 4096,
    },
    fetchFn,
  );
  return parseCategorizationResponse(raw, validNames);
}

export const AI_BATCH_SIZE = 25;
