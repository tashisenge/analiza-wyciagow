"use client";

import { useState } from "react";

import { AiPanelButtons } from "@/components/dashboard/AiPanelButtons";
import { InfoTip } from "@/components/ui/InfoTip";
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
    <div className="mt-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-brand-900">Ostatnia analiza AI</h3>
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
    <section className="section-card border-brand-200 bg-gradient-to-br from-brand-50/80 to-calm-50">
      <h2 className="section-title">
        AI — kategoryzacja i analiza
        <InfoTip label="AI">
          Automatyczne przypisanie kategorii i krótkie podsumowanie trendów (Claude lub
          ChatGPT).
        </InfoTip>
      </h2>
      <p className="mt-1 text-sm text-brand-800">
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
        <p className="mt-2 text-xs text-brand-700">
          Kategoryzacja AI: brak transakcji w «Bez kategorii» — użyj mapowania mBank lub
          zmień kategorie ręcznie na liście transakcji.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 text-sm font-medium text-green-800">{message}</p>
      ) : null}
      {error ? <p className="alert-error mt-3">{error}</p> : null}
      {insight ? (
        <AiInsightBlock insight={insight} generatedAt={formatInsightDate(insightAt)} />
      ) : aiAvailable ? (
        <p className="mt-3 text-sm text-brand-700">
          Kliknij «Analiza AI», aby wygenerować podsumowanie wydatków — wynik zostanie
          zapisany i będzie widoczny po odświeżeniu strony.
        </p>
      ) : null}
    </section>
  );
}
