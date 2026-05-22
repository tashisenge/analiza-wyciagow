import type { OpportunityResearch } from "@prisma/client";

import {
  parseAlternativesJson,
  parseSourcesJson,
} from "@/lib/research/parse-research-json";
import type { OpportunityResearchView } from "@/lib/research/types";

export function mapResearchToView(
  row: OpportunityResearch | null | undefined,
): OpportunityResearchView | null {
  if (!row) {
    return null;
  }
  return {
    summaryMarkdown: row.summaryMarkdown,
    alternatives: parseAlternativesJson(row.alternatives),
    sources: parseSourcesJson(row.sources),
    researchedAt: row.researchedAt.toISOString(),
  };
}
