import { AmountValue } from "@/components/privacy/AmountValue";
import type { SavingsImpactSummary } from "@/lib/optimization/aggregate-savings-impact";

interface ImplementedSavingsSummaryProps {
  summary: SavingsImpactSummary;
}

export function ImplementedSavingsSummary({
  summary,
}: ImplementedSavingsSummaryProps): React.JSX.Element | null {
  if (summary.totalImplemented === 0) {
    return null;
  }

  return (
    <section className="section-card border-emerald-200 bg-emerald-50/50">
      <h2 className="section-title text-emerald-900">Wdrożone → efekt</h2>
      <p className="mt-1 text-sm text-emerald-900/80">
        Podsumowanie zmian oznaczonych jako wdrożone. Badge „Działa” pojawia się po ~30
        dniach, gdy spend na kontrahencie spadł &gt;10%.
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase text-slate-500">Wdrożone</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {String(summary.totalImplemented)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Zweryfikowane</dt>
          <dd className="text-lg font-semibold text-emerald-800">
            {String(summary.verifiedCount)}
            {summary.pendingVerificationCount > 0 ? (
              <span className="ml-1 text-xs font-normal text-slate-600">
                (+{String(summary.pendingVerificationCount)} oczekuje)
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">Szac. oszczędności</dt>
          <dd className="text-lg font-semibold text-emerald-800">
            <AmountValue>
              ~{summary.verifiedMonthlySavingsPln.toFixed(2)} PLN/mies.
            </AmountValue>
          </dd>
        </div>
      </dl>
    </section>
  );
}
