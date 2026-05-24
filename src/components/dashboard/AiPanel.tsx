"use client";

import { useState } from "react";

import { AiCategorizeHelp } from "@/components/dashboard/AiCategorizeHelp";
import { AiInsightHistory } from "@/components/dashboard/AiInsightHistory";
import type { AiInsightHistoryEntry } from "@/components/dashboard/AiInsightHistory";
import { AiPanelButtons } from "@/components/dashboard/AiPanelButtons";
import { AiProviderSelect } from "@/components/dashboard/AiProviderSelect";
import { InfoTip } from "@/components/ui/InfoTip";
import type { AiActionResult } from "@/server/actions/ai";

interface AiPanelProps {
  aiAvailable: boolean;
  aiPreference: string;
  activeProvider: string | null;
  availableProviders: string[];
  aiTargetCount: number;
  context: string;
  insightHistory: AiInsightHistoryEntry[];
  excludedCategoryCount: number;
}

export function AiPanel({
  aiAvailable,
  aiPreference,
  activeProvider,
  availableProviders,
  aiTargetCount,
  context,
  insightHistory,
  excludedCategoryCount,
}: AiPanelProps): React.JSX.Element {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = insightHistory[0] ?? null;

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
          Wybierz model, generuj analizy bez transferów wewnętrznych; wykluczenia
          kategorii w ustawieniach.
        </InfoTip>
      </h2>

      {aiAvailable ? (
        <div className="mt-3">
          <AiProviderSelect
            preference={aiPreference}
            activeProvider={activeProvider}
            availableProviders={availableProviders}
            disabled={busy}
          />
        </div>
      ) : (
        <p className="mt-1 text-sm text-brand-800">
          Dodaj ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env / Vercel i zrestartuj
          aplikację.
        </p>
      )}

      {excludedCategoryCount > 0 ? (
        <p className="mt-2 text-xs text-slate-600">
          Z analiz wykluczono {String(excludedCategoryCount)} kategorii —{" "}
          <a href="/settings" className="link-brand">
            ustawienia AI
          </a>
        </p>
      ) : null}

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

      <AiCategorizeHelp />

      {aiTargetCount === 0 && aiAvailable ? (
        <p className="mt-2 text-xs text-brand-700">
          Brak transakcji w «Bez kategorii» — użyj mapowania mBank lub ręcznej
          kategoryzacji.
        </p>
      ) : null}

      {message ? <p className="alert-success mt-3">{message}</p> : null}
      {error ? <p className="alert-error mt-3">{error}</p> : null}

      {latest ? (
        <AiInsightHistory entries={insightHistory} initialSelectedId={latest.id} />
      ) : aiAvailable ? (
        <p className="mt-3 text-sm text-brand-700">
          Kliknij «Analiza AI», aby wygenerować pierwsze podsumowanie — zapisze się w
          historii.
        </p>
      ) : null}
    </section>
  );
}
