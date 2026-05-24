"use client";

import { useState } from "react";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { RecurringSuspectRow } from "@/lib/recurring/recurring-suspect-types";
import type { RecurringActionResult } from "@/server/actions/recurring";
import {
  acceptRecurringOpportunity,
  dismissRecurringOpportunity,
} from "@/server/actions/recurring";

const TYPE_LABELS: Record<string, string> = {
  RECURRING: "Powtarzalna płatność",
  SUBSCRIPTION: "Subskrypcja",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Do decyzji",
  ACKNOWLEDGED: "Zaakceptowana",
  IMPLEMENTED: "Wdrożona",
  DISMISSED: "Odrzucona",
};

interface RecurringSuspectCardProps {
  suspect: RecurringSuspectRow;
}

export function RecurringSuspectCard({
  suspect,
}: RecurringSuspectCardProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(
    action: (id: string) => Promise<RecurringActionResult>,
  ): Promise<void> {
    setLoading(true);
    setMessage(null);
    const result = await action(suspect.id);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    window.location.reload();
  }

  const txHref = suspect.counterparty
    ? `/transactions?counterparty=${encodeURIComponent(suspect.counterparty)}`
    : "/transactions";
  const isOpen = suspect.status === "OPEN";

  return (
    <article className="section-card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              {TYPE_LABELS[suspect.type] ?? suspect.type}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {STATUS_LABELS[suspect.status] ?? suspect.status}
            </span>
            {suspect.isMarkedSubscription ? (
              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-800">
                subskrypcja
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{suspect.title}</h3>
          {suspect.counterparty ? (
            <p className="text-sm text-slate-600">{suspect.counterparty}</p>
          ) : null}
        </div>
        {suspect.estimatedMonthlySavings !== null ? (
          <p className="text-sm font-medium text-emerald-700">
            <AmountValue>
              ~{suspect.estimatedMonthlySavings.toFixed(2)} PLN/mies.
            </AmountValue>
          </p>
        ) : null}
      </div>

      <p className="text-sm text-slate-600">{suspect.description}</p>
      {suspect.categoryName ? (
        <p className="text-xs text-slate-500">Kategoria: {suspect.categoryName}</p>
      ) : null}

      {suspect.evidenceTransactions.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Transakcje dowodowe ({suspect.evidenceTransactions.length})
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
            {suspect.evidenceTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1"
              >
                <span className="text-slate-700">
                  {tx.bookedAt.slice(0, 10)} — {tx.description.slice(0, 60)}
                </span>
                <AmountValue className="whitespace-nowrap font-medium text-slate-900">
                  {tx.amount} PLN
                </AmountValue>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <a href={txHref} className="link-brand text-sm">
          Wszystkie transakcje
        </a>
        {isOpen ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runAction(acceptRecurringOpportunity)}
              className="btn-primary text-sm"
            >
              Zaakceptuj sugestię
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runAction(dismissRecurringOpportunity)}
              className="btn-secondary text-sm"
            >
              Odrzuć
            </button>
          </>
        ) : null}
      </div>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </article>
  );
}
