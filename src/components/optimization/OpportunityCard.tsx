"use client";

import { useState } from "react";

import { ResearchAlternatives } from "@/components/optimization/ResearchAlternatives";
import type { OpportunityResearchView } from "@/lib/research/types";
import type { OptimizationActionResult } from "@/server/actions/optimization";
import { updateOpportunityStatus } from "@/server/actions/optimization";

interface OpportunityView {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedMonthlySavings: { toString(): string } | null;
  counterparty: string | null;
  categoryId: string | null;
  savingsVerified: boolean;
  researchSection?: {
    eligible: boolean;
    researchAvailable: boolean;
    initialResearch: OpportunityResearchView | null;
  };
}

const TYPE_LABELS: Record<string, string> = {
  RECURRING: "Powtarzalne",
  SUBSCRIPTION: "Subskrypcja",
  ANOMALY: "Wpadka",
  MERCHANT_SPIKE: "Skok",
  BUDGET_OVERRUN: "Budżet",
};

interface OpportunityCardProps {
  opportunity: OpportunityView;
  showVerifiedBadge?: boolean;
}

export function OpportunityCard({
  opportunity,
  showVerifiedBadge = false,
}: OpportunityCardProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runStatus(status: string): Promise<void> {
    setLoading(true);
    setMessage(null);
    const result: OptimizationActionResult = await updateOpportunityStatus(
      opportunity.id,
      status,
    );
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    window.location.reload();
  }

  const savings = opportunity.estimatedMonthlySavings
    ? Number(opportunity.estimatedMonthlySavings)
    : null;
  const txHref = opportunity.counterparty
    ? `/transactions?counterparty=${encodeURIComponent(opportunity.counterparty)}`
    : opportunity.categoryId
      ? `/transactions?categoryId=${opportunity.categoryId}`
      : "/transactions";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium uppercase text-indigo-600">
            {TYPE_LABELS[opportunity.type] ?? opportunity.type}
          </span>
          <h3 className="font-semibold text-slate-900">{opportunity.title}</h3>
        </div>
        {savings !== null ? (
          <p className="text-sm font-medium text-emerald-700">
            ~{savings.toFixed(2)} PLN/mies.
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">{opportunity.description}</p>
      {showVerifiedBadge && opportunity.savingsVerified ? (
        <span className="mt-2 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
          Działa — spend spadł
        </span>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={txHref} className="text-sm text-indigo-600 underline">
          Zobacz transakcje
        </a>
        {!showVerifiedBadge ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runStatus("IMPLEMENTED")}
              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
            >
              Wdrożone
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runStatus("DISMISSED")}
              className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800"
            >
              Odrzuć
            </button>
          </>
        ) : null}
      </div>
      {message ? <p className="mt-2 text-sm text-red-700">{message}</p> : null}
      {opportunity.researchSection ? (
        <ResearchAlternatives
          opportunityId={opportunity.id}
          eligible={opportunity.researchSection.eligible}
          researchAvailable={opportunity.researchSection.researchAvailable}
          initialResearch={opportunity.researchSection.initialResearch}
        />
      ) : null}
    </article>
  );
}
