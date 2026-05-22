import type { OpportunityType, PrismaClient } from "@prisma/client";

import { getAiConfig } from "@/lib/ai/config";
import { hitsToSources, synthesizeAlternatives } from "@/lib/ai/synthesize-alternatives";
import { buildSearchQuery } from "@/lib/research/build-search-query";
import { getTavilyConfig } from "@/lib/research/config";
import {
  countDailyResearch,
  isDailyLimitReached,
} from "@/lib/research/count-daily-research";
import { isResearchEligible } from "@/lib/research/is-research-eligible";
import { normalizeMerchant } from "@/lib/research/normalize-merchant";
import { isResearchCacheFresh, mapCachedResearch } from "@/lib/research/research-cache";
import { searchTavily, type FetchFn } from "@/lib/research/search-tavily";
import type { ResearchResult } from "@/lib/research/types";
import { RESEARCH_DAILY_LIMIT } from "@/lib/research/types";

export interface ResearchRunInput {
  workspaceId: string;
  opportunityId: string;
  forceRefresh?: boolean;
}

interface OpportunityRow {
  id: string;
  workspaceId: string;
  type: OpportunityType;
  counterparty: string | null;
  description: string;
  estimatedMonthlySavings: { toString(): string } | null;
}

export class ResearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResearchError";
  }
}

function assertConfigs(): {
  tavily: NonNullable<ReturnType<typeof getTavilyConfig>>;
  ai: NonNullable<ReturnType<typeof getAiConfig>>;
} {
  const tavily = getTavilyConfig();
  const ai = getAiConfig();
  if (!tavily) {
    throw new ResearchError("Brak TAVILY_API_KEY w .env");
  }
  if (!ai) {
    throw new ResearchError("Brak klucza AI. Ustaw ANTHROPIC_API_KEY lub OPENAI_API_KEY");
  }
  return { tavily, ai };
}

async function loadOpportunity(
  prisma: PrismaClient,
  workspaceId: string,
  opportunityId: string,
): Promise<OpportunityRow> {
  const row = await prisma.optimizationOpportunity.findFirst({
    where: { id: opportunityId, workspaceId },
    select: {
      id: true,
      workspaceId: true,
      type: true,
      counterparty: true,
      description: true,
      estimatedMonthlySavings: true,
    },
  });
  if (!row) {
    throw new ResearchError("Nie znaleziono możliwości optymalizacji");
  }
  return row;
}

async function readCache(
  prisma: PrismaClient,
  opportunityId: string,
): Promise<ResearchResult | null> {
  const cached = await prisma.opportunityResearch.findUnique({
    where: { opportunityId },
  });
  if (!cached || !isResearchCacheFresh(cached.researchedAt)) {
    return null;
  }
  return mapCachedResearch(cached);
}

async function assertDailyLimit(
  prisma: PrismaClient,
  workspaceId: string,
): Promise<void> {
  const dailyCount = await countDailyResearch(prisma, workspaceId);
  if (isDailyLimitReached(dailyCount)) {
    throw new ResearchError(
      `Limit ${String(RESEARCH_DAILY_LIMIT)} wyszukiwań dziennie — spróbuj jutro`,
    );
  }
}

function parseMonthlyPln(value: { toString(): string } | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

async function saveResearch(
  prisma: PrismaClient,
  opportunity: OpportunityRow,
  payload: Omit<ResearchResult, "fromCache" | "researchedAt">,
): Promise<ResearchResult> {
  const researchedAt = new Date();
  const data = {
    searchQuery: payload.searchQuery,
    summaryMarkdown: payload.summaryMarkdown,
    alternatives: payload.alternatives,
    sources: payload.sources,
    researchedAt,
  };
  await prisma.opportunityResearch.upsert({
    where: { opportunityId: opportunity.id },
    create: {
      workspaceId: opportunity.workspaceId,
      opportunityId: opportunity.id,
      ...data,
    },
    update: data,
  });
  return { ...payload, researchedAt, fromCache: false };
}

async function runSearchAndSynthesize(
  opportunity: OpportunityRow,
  fetchFn?: FetchFn,
): Promise<Omit<ResearchResult, "researchedAt" | "fromCache">> {
  const { tavily, ai } = assertConfigs();
  const counterparty = opportunity.counterparty ?? "";
  const searchQuery = buildSearchQuery(counterparty);
  const hits = await searchTavily(tavily, searchQuery, fetchFn);
  const synthesized = await synthesizeAlternatives(
    ai,
    {
      merchantLabel: normalizeMerchant(counterparty),
      currentMonthlyPln: parseMonthlyPln(opportunity.estimatedMonthlySavings),
      opportunityDescription: opportunity.description,
      hits,
    },
    fetchFn,
  );
  return {
    searchQuery,
    summaryMarkdown: synthesized.summaryMarkdown,
    alternatives: synthesized.alternatives,
    sources: hitsToSources(hits),
  };
}

async function fetchFreshResearch(
  prisma: PrismaClient,
  opportunity: OpportunityRow,
  fetchFn?: FetchFn,
): Promise<ResearchResult> {
  await assertDailyLimit(prisma, opportunity.workspaceId);
  const payload = await runSearchAndSynthesize(opportunity, fetchFn);
  return saveResearch(prisma, opportunity, payload);
}

export async function runOpportunityResearch(
  prisma: PrismaClient,
  input: ResearchRunInput,
  fetchFn?: FetchFn,
): Promise<ResearchResult> {
  assertConfigs();
  const opportunity = await loadOpportunity(
    prisma,
    input.workspaceId,
    input.opportunityId,
  );

  if (!isResearchEligible(opportunity.type, opportunity.counterparty)) {
    throw new ResearchError(
      "Research dostępny tylko dla subskrypcji i opłat powtarzalnych",
    );
  }

  if (!input.forceRefresh) {
    const cached = await readCache(prisma, input.opportunityId);
    if (cached) {
      return cached;
    }
  }

  return fetchFreshResearch(prisma, opportunity, fetchFn);
}
