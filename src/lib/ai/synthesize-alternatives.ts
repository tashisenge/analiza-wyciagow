import { z } from "zod";

import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import type { TavilySearchHit } from "@/lib/research/search-tavily";
import type { ResearchAlternative, ResearchSource } from "@/lib/research/types";

const responseSchema = z.object({
  summaryMarkdown: z.string(),
  alternatives: z.array(
    z.object({
      name: z.string(),
      estimatedMonthlyPln: z.number().nullable(),
      note: z.string(),
    }),
  ),
});

const SYSTEM_PROMPT = `Jesteś asystentem oszczędzania w Polsce. Na podstawie wyników wyszukiwania w internecie
zaproponuj tańsze lub równoważne alternatywy dla usługi użytkownika.

Zasady:
- Odpowiedź TYLKO jako JSON: {"summaryMarkdown":"...","alternatives":[{"name":"...","estimatedMonthlyPln":29.99,"note:"..."}]}
- summaryMarkdown: 2-4 zdania po polsku (markdown), bez ogólników
- alternatives: max 5 pozycji; estimatedMonthlyPln tylko gdy wynika ze źródeł, inaczej null
- Nie wymyślaj cen — jeśli brak w snippetach, estimatedMonthlyPln: null
- Ton: konkretny, bez moralizowania`;

export interface SynthesisInput {
  merchantLabel: string;
  currentMonthlyPln: number | null;
  opportunityDescription: string;
  hits: TavilySearchHit[];
}

function extractJsonText(raw: string): string {
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/i;
  const fenced = fencePattern.exec(raw);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    return raw.slice(jsonStart, jsonEnd + 1);
  }
  return raw.trim();
}

export function parseAlternativesResponse(raw: string): {
  summaryMarkdown: string;
  alternatives: ResearchAlternative[];
} {
  const parsed = responseSchema.parse(JSON.parse(extractJsonText(raw)));
  return {
    summaryMarkdown: parsed.summaryMarkdown,
    alternatives: parsed.alternatives.slice(0, 5),
  };
}

function buildUserPrompt(input: SynthesisInput): string {
  const snippets = input.hits.map((hit) => ({
    title: hit.title,
    url: hit.url,
    excerpt: hit.content,
  }));
  return JSON.stringify(
    {
      usługa: input.merchantLabel,
      szacowany_koszt_mies_pln: input.currentMonthlyPln,
      kontekst: input.opportunityDescription,
      wyniki_wyszukiwania: snippets,
    },
    null,
    2,
  );
}

export function hitsToSources(hits: TavilySearchHit[]): ResearchSource[] {
  return hits.slice(0, 8).map((hit) => ({ title: hit.title, url: hit.url }));
}

export async function synthesizeAlternatives(
  config: AiConfig,
  input: SynthesisInput,
  fetchFn?: FetchFn,
): Promise<{ summaryMarkdown: string; alternatives: ResearchAlternative[] }> {
  const raw = await completeWithAi(
    config,
    { system: SYSTEM_PROMPT, user: buildUserPrompt(input), maxTokens: 1200 },
    fetchFn,
  );
  return parseAlternativesResponse(raw);
}
