import type { OpportunityResearch } from "@prisma/client";

import type {
  OpportunityResearchView,
  ResearchAlternative,
  ResearchSource,
} from "@/lib/research/types";

export function mapResearchToView(
  row: OpportunityResearch | null | undefined,
): OpportunityResearchView | null {
  if (!row) {
    return null;
  }
  return {
    summaryMarkdown: row.summaryMarkdown,
    alternatives: row.alternatives as ResearchAlternative[],
    sources: row.sources as ResearchSource[],
    researchedAt: row.researchedAt.toISOString(),
  };
}
