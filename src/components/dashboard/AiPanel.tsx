"use client";

import { useState } from "react";

import { AiPanelButtons } from "@/components/dashboard/AiPanelButtons";
import type { AiActionResult } from "@/server/actions/ai";

interface AiPanelProps {
  aiAvailable: boolean;
  aiProvider: string | null;
  aiTargetCount: number;
  context: string;
  initialInsight: string | null;
  initialInsightAt: string | null;
}

function formatInsightDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AiInsightBlock({
  insight,
  generatedAt,
}: {
  insight: string;
  generatedAt: string | null;
}): React.JSX.Element {
  return (
    <div className="mt-4 rounded-lg border border-indigo-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-indigo-900">Ostatnia analiza AI</h3>
        {generatedAt ? (
          <span className="text-xs text-slate-500">{generatedAt}</span>
        ) : null}
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
        {insight}
      </pre>
    </div>
  );
}

export function AiPanel({
  aiAvailable,
  aiProvider,
  aiTargetCount,
  context,
  initialInsight,
  initialInsightAt,
}: AiPanelProps): React.JSX.Element {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(initialInsight);
  const [insightAt, setInsightAt] = useState<string | null>(initialInsightAt);
  const [error, setError] = useState<string | null>(null);

  async function runAction(
    action: () => Promise<AiActionResult>,
    label: string,
    reloadOnSuccess: boolean,
  ): Promise<void> {
    setLoading(label);
    setError(null);
    setMessage(null);
    const result = await action();
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
    if (result.insight) {
      setInsight(result.insight);
      setInsightAt(new Date().toISOString());
      return;
    }
    if (reloadOnSuccess) {
      window.location.reload();
    }
  }

  const busy = loading !== null;

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <h2 className="text-lg font-semibold text-indigo-900">
        AI — kategoryzacja i analiza
      </h2>
      <p className="mt-1 text-sm text-indigo-800">
        {aiAvailable
          ? `Aktywny provider: ${aiProvider ?? "?"}. Claude lub ChatGPT przypisują kategorie i opisują trendy.`
          : "Dodaj ANTHROPIC_API_KEY lub OPENAI_API_KEY do pliku .env i zrestartuj serwer (npm run dev)."}
      </p>

      <AiPanelButtons
        aiAvailable={aiAvailable}
        aiTargetCount={aiTargetCount}
        context={context}
        busy={busy}
        loading={loading}
        onRun={(action, label, reload) => {
          void runAction(action, label, reload);
        }}
      />

      {aiTargetCount === 0 && aiAvailable ? (
        <p className="mt-2 text-xs text-indigo-700">
          Kategoryzacja AI: brak transakcji w «Bez kategorii» — użyj mapowania mBank lub
          zmień kategorie ręcznie na liście transakcji.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 text-sm font-medium text-green-800">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded bg-red-50 px-2 py-1 text-sm text-red-800">{error}</p>
      ) : null}
      {insight ? (
        <AiInsightBlock insight={insight} generatedAt={formatInsightDate(insightAt)} />
      ) : aiAvailable ? (
        <p className="mt-3 text-sm text-indigo-700">
          Kliknij «Analiza AI», aby wygenerować podsumowanie wydatków — wynik zostanie
          zapisany i będzie widoczny po odświeżeniu strony.
        </p>
      ) : null}
    </section>
  );
}
