"use client";

import { useState } from "react";

import { InfoTip } from "@/components/ui/InfoTip";
import { getAiCategorizePreview } from "@/server/actions/ai";

export function AiCategorizeHelp(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [headline, setHeadline] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [samples, setSamples] = useState<
    { counterparty: string; description: string; amount: string }[]
  >([]);

  async function loadPreview(): Promise<void> {
    setLoading(true);
    const result = await getAiCategorizePreview();
    setLoading(false);
    if (!result.ok) {
      setHeadline(result.error);
      return;
    }
    setHeadline(result.description.headline);
    setSteps(result.description.steps);
    setSamples(result.description.samples);
    setOpen(true);
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className="text-xs font-medium text-brand-700 underline decoration-brand-200"
        onClick={() => {
          void loadPreview();
        }}
      >
        {loading ? "Ładowanie…" : "Co robi „Kategoryzuj AI”?"}
      </button>
      <InfoTip label="Kategoryzuj AI">
        Przypisuje kategorie tylko transakcjom bez sensownej kategorii (max 100), w
        partiach po 25.
      </InfoTip>
      {open && headline ? (
        <div className="help-panel mt-2">
          <p className="font-medium text-slate-800">{headline}</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-600">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {samples.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-calm-200 pt-2 text-xs text-slate-600">
              {samples.map((sample, index) => (
                <li key={index}>
                  {sample.counterparty || "—"} · {sample.amount} ·{" "}
                  {sample.description.slice(0, 60)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
