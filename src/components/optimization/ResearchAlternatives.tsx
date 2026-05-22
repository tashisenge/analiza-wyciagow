"use client";

import { useState } from "react";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { OpportunityResearchView } from "@/lib/research/types";
import type { ResearchActionResult } from "@/server/actions/research";
import { researchOpportunityAlternatives } from "@/server/actions/research";

interface ResearchAlternativesProps {
  opportunityId: string;
  eligible: boolean;
  researchAvailable: boolean;
  initialResearch: OpportunityResearchView | null;
}

function formatResearchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ResearchAlternatives({
  opportunityId,
  eligible,
  researchAvailable,
  initialResearch,
}: ResearchAlternativesProps): React.JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [research, setResearch] = useState<OpportunityResearchView | null>(
    initialResearch,
  );

  if (!eligible) {
    return null;
  }

  async function runSearch(): Promise<void> {
    setLoading(true);
    setError(null);
    const result: ResearchActionResult = await researchOpportunityAlternatives(
      opportunityId,
      Boolean(research),
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResearch({
      summaryMarkdown: result.result.summaryMarkdown,
      alternatives: result.result.alternatives,
      sources: result.result.sources,
      researchedAt: result.result.researchedAt.toISOString(),
      fromCache: result.result.fromCache,
    });
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="text-xs text-slate-500">
        Informacje z internetu — zweryfikuj ceny i warunki samodzielnie. To nie jest
        porada finansowa.
      </p>
      <button
        type="button"
        disabled={loading || !researchAvailable}
        onClick={() => void runSearch()}
        title={
          researchAvailable ? undefined : "Ustaw TAVILY_API_KEY oraz klucz AI w .env"
        }
        className="mt-2 rounded bg-violet-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Szukam…" : research ? "Odśwież alternatywy" : "Szukaj alternatyw"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {research ? <ResearchResultView research={research} /> : null}
    </div>
  );
}

function ResearchResultView({
  research,
}: {
  research: OpportunityResearchView;
}): React.JSX.Element {
  return (
    <div className="mt-3 space-y-2 rounded bg-slate-50 p-3 text-sm">
      <p className="text-xs text-slate-500">
        Zapisano {formatResearchDate(research.researchedAt)}
        {research.fromCache ? " (cache)" : null}
      </p>
      <p className="whitespace-pre-wrap text-slate-800">{research.summaryMarkdown}</p>
      {research.alternatives.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          {research.alternatives.map((alt) => (
            <li key={alt.name}>
              <span className="font-medium">{alt.name}</span>
              {alt.estimatedMonthlyPln !== null ? (
                <span>
                  {" "}
                  —{" "}
                  <AmountValue>
                    ~{alt.estimatedMonthlyPln.toFixed(2)} PLN/mies.
                  </AmountValue>
                </span>
              ) : null}
              {alt.note ? <span className="text-slate-600"> ({alt.note})</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {research.sources.length > 0 ? (
        <ul className="space-y-1">
          {research.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-brand"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
