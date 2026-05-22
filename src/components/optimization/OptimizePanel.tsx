"use client";

import { useState } from "react";

import { OpportunityCard } from "@/components/optimization/OpportunityCard";
import type { OptimizationActionResult } from "@/server/actions/optimization";
import { refreshOptimizationOpportunities } from "@/server/actions/optimization";

type OpportunityView = Parameters<typeof OpportunityCard>[0]["opportunity"];

interface OptimizePanelProps {
  context: string;
  open: OpportunityView[];
  implemented: OpportunityView[];
}

export function OptimizePanel({
  context,
  open,
  implemented,
}: OptimizePanelProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    setLoading(true);
    const result: OptimizationActionResult =
      await refreshOptimizationOpportunities(context);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(result.message);
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="btn-primary"
        >
          {loading ? "Odświeżanie…" : "Odśwież możliwości"}
        </button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Możliwości oszczędności</h2>
        {open.length === 0 ? (
          <p className="text-sm text-slate-600">
            Brak wykrytych możliwości — kliknij odśwież po imporcie transakcji.
          </p>
        ) : (
          <div className="space-y-3">
            {open.map((item) => (
              <OpportunityCard key={item.id} opportunity={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Wdrożone w tym miesiącu</h2>
        {implemented.length === 0 ? (
          <p className="text-sm text-slate-600">Brak wdrożonych zmian w tym miesiącu.</p>
        ) : (
          <div className="space-y-3">
            {implemented.map((item) => (
              <OpportunityCard key={item.id} opportunity={item} showVerifiedBadge />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
