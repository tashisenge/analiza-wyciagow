import type { OpportunityResearch } from "@prisma/client";

import {
  parseAlternativesJson,
  parseSourcesJson,
} from "@/lib/research/parse-research-json";
import type { ResearchResult } from "@/lib/research/types";
import { RESEARCH_CACHE_DAYS } from "@/lib/research/types";

export function isResearchCacheFresh(researchedAt: Date, now = new Date()): boolean {
  const maxAgeMs = RESEARCH_CACHE_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - researchedAt.getTime() < maxAgeMs;
}

export function mapCachedResearch(row: OpportunityResearch): ResearchResult {
  return {
    searchQuery: row.searchQuery,
    summaryMarkdown: row.summaryMarkdown,
    alternatives: parseAlternativesJson(row.alternatives),
    sources: parseSourcesJson(row.sources),
    researchedAt: row.researchedAt,
    fromCache: true,
  };
}
