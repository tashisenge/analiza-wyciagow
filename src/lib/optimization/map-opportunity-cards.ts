import type { OpportunityType } from "@prisma/client";

import type { OpportunityWithRelations } from "@/lib/optimization/load-optimization-data";
import { isResearchAvailable } from "@/lib/research/config";
import { buildResearchSectionProps } from "@/lib/research/opportunity-research-props";
import type { OpportunityResearchView } from "@/lib/research/types";

export interface MappedOpportunityCard {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  estimatedMonthlySavings: string | null;
  counterparty: string | null;
  categoryId: string | null;
  savingsVerified: boolean;
  researchSection: {
    opportunityId: string;
    eligible: boolean;
    researchAvailable: boolean;
    initialResearch: OpportunityResearchView | null;
  };
}

export function mapOpportunitiesForCards(
  opportunities: OpportunityWithRelations[],
): MappedOpportunityCard[] {
  const researchAvailable = isResearchAvailable();
  return opportunities.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    // Prisma Decimal is a class. Next.js throws if it is passed to a client component.
    estimatedMonthlySavings: item.estimatedMonthlySavings
      ? item.estimatedMonthlySavings.toString()
      : null,
    counterparty: item.counterparty,
    categoryId: item.categoryId,
    savingsVerified: item.savingsVerified,
    researchSection: buildResearchSectionProps(item, researchAvailable),
  }));
}
