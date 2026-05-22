export interface ResearchAlternative {
  name: string;
  estimatedMonthlyPln: number | null;
  note: string;
}

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchResult {
  searchQuery: string;
  summaryMarkdown: string;
  alternatives: ResearchAlternative[];
  sources: ResearchSource[];
  researchedAt: Date;
  fromCache: boolean;
}

export interface OpportunityResearchView {
  summaryMarkdown: string;
  alternatives: ResearchAlternative[];
  sources: ResearchSource[];
  researchedAt: string;
  fromCache?: boolean;
}

export const RESEARCH_CACHE_DAYS = 30;
export const RESEARCH_DAILY_LIMIT = 10;

export const RESEARCH_ELIGIBLE_TYPES = ["SUBSCRIPTION", "RECURRING"] as const;
