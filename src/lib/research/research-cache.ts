import type { OpportunityResearch } from "@prisma/client";

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
    alternatives: row.alternatives as ResearchResult["alternatives"],
    sources: row.sources as ResearchResult["sources"],
    researchedAt: row.researchedAt,
    fromCache: true,
  };
}
