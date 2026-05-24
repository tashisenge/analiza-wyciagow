"use client";

import { useState, useTransition } from "react";

import type { DiscretionaryActionResult } from "@/server/actions/discretionary";
import { upsertDiscretionaryBudget } from "@/server/actions/discretionary";

interface DiscretionaryLimitEditorProps {
  context: string;
  currentLimit: number | null;
}

export function DiscretionaryLimitEditor({
  context,
  currentLimit,
}: DiscretionaryLimitEditorProps): React.JSX.Element {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="section-card max-w-md">
      <h2 className="section-title">Limit miesięczny</h2>
      <p className="mt-1 text-sm text-slate-600">
        Dotyczy kontekstu <strong>{context}</strong>. Porównywany z sumą opcjonalnych w wybranym
        okresie.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const raw = new FormData(form).get("monthlyLimit");
          const monthlyLimit =
            typeof raw === "string" ? Number.parseFloat(raw) : Number.NaN;
          startTransition(() => {
            void upsertDiscretionaryBudget(context, monthlyLimit).then(
              (result: DiscretionaryActionResult) => {
                setMessage(result.ok ? result.message : result.error);
              },
            );
          });
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">PLN / miesiąc</span>
          <input
            name="monthlyLimit"
            type="number"
            min={1}
            max={999999}
            step={1}
            required
            defaultValue={currentLimit ?? undefined}
            className="rounded-lg border border-calm-200 px-3 py-2"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Zapisuję…" : "Zapisz"}
        </button>
      </form>
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
