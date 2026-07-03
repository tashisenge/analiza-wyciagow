import Link from "next/link";

import type { SavingsRitualStep } from "@/lib/analytics/savings-ritual-state";
import { savingsRitualCoreComplete } from "@/lib/analytics/savings-ritual-state";

interface SavingsRitualWidgetProps {
  steps: SavingsRitualStep[];
}

function stepIcon(done: boolean, optional?: boolean): string {
  if (optional) {
    return "○";
  }
  return done ? "✓" : "•";
}

function stepClass(done: boolean, optional?: boolean): string {
  if (optional) {
    return "text-slate-500";
  }
  return done ? "text-emerald-700" : "text-amber-800";
}

export function SavingsRitualWidget({
  steps,
}: SavingsRitualWidgetProps): React.JSX.Element {
  const coreComplete = savingsRitualCoreComplete(steps);

  return (
    <section className="section-card border-emerald-200 bg-emerald-50/40">
      <h2 className="section-title text-emerald-900">Rytuał oszczędzania</h2>
      <p className="mt-1 text-sm text-emerald-900/80">
        {coreComplete
          ? "Podstawowe kroki zrobione — możesz śledzić efekty optymalizacji."
          : "4 kroki, żeby liczby i alerty miały sens."}
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 w-4 shrink-0 font-semibold ${stepClass(step.done, step.optional)}`}
              aria-hidden
            >
              {stepIcon(step.done, step.optional)}
            </span>
            <div className="min-w-0">
              <p className={`font-medium ${stepClass(step.done, step.optional)}`}>
                {index + 1}. {step.label}
                {step.optional ? (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    (opcjonalne)
                  </span>
                ) : null}
              </p>
              {step.hint ? <p className="text-xs text-slate-600">{step.hint}</p> : null}
              {step.href && (!step.done || step.optional) ? (
                <Link href={step.href} className="link-brand text-xs">
                  {step.optional ? "Wygeneruj raport →" : "Dokończ krok →"}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
