"use client";

import { useState } from "react";

import { RecurringSuspectCard } from "@/components/recurring/RecurringSuspectCard";
import type {
  RecurringStatusFilter,
  RecurringSuspectRow,
} from "@/lib/recurring/recurring-suspect-types";
import type { OptimizationActionResult } from "@/server/actions/optimization";
import { refreshOptimizationOpportunities } from "@/server/actions/optimization";

interface RecurringSuspectsViewProps {
  context: string;
  statusFilter: RecurringStatusFilter;
  suspects: RecurringSuspectRow[];
  openCount: number;
  acceptedCount: number;
  dismissedCount: number;
}

const FILTER_TABS: { value: RecurringStatusFilter; label: string }[] = [
  { value: "open", label: "Do decyzji" },
  { value: "accepted", label: "Zaakceptowane" },
  { value: "dismissed", label: "Odrzucone" },
  { value: "all", label: "Wszystkie" },
];

function tabHref(context: string, status: RecurringStatusFilter): string {
  return `/recurring?context=${context}&status=${status}`;
}

export function RecurringSuspectsView({
  context,
  statusFilter,
  suspects,
  openCount,
  acceptedCount,
  dismissedCount,
}: RecurringSuspectsViewProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const counts: Record<RecurringStatusFilter, number> = {
    open: openCount,
    accepted: acceptedCount,
    dismissed: dismissedCount,
    all: openCount + acceptedCount + dismissedCount,
  };

  async function refresh(): Promise<void> {
    setLoading(true);
    setMessage(null);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="btn-primary"
        >
          {loading ? "Skanowanie…" : "Odśwież wykrywanie"}
        </button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filtr statusu">
        {FILTER_TABS.map((tab) => (
          <a
            key={tab.value}
            href={tabHref(context, tab.value)}
            className={
              statusFilter === tab.value
                ? "rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white"
                : "rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
            }
          >
            {tab.label} ({counts[tab.value]})
          </a>
        ))}
      </nav>

      {suspects.length === 0 ? (
        <p className="section-card text-sm text-slate-600">
          {statusFilter === "open"
            ? "Brak otwartych podejrzeń. Kliknij „Odśwież wykrywanie” po imporcie transakcji lub sprawdź inne zakładki."
            : "Brak pozycji w tej kategorii."}
        </p>
      ) : (
        <div className="space-y-4">
          {suspects.map((suspect) => (
            <RecurringSuspectCard key={suspect.id} suspect={suspect} />
          ))}
        </div>
      )}
    </div>
  );
}
