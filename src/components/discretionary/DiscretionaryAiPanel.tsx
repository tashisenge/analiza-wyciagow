"use client";

import { useState } from "react";

import type { DiscretionaryAiInsightEntry } from "@/components/discretionary/discretionary-ai-types";
import { DiscretionaryAiHistory } from "@/components/discretionary/DiscretionaryAiHistory";
import { InfoTip } from "@/components/ui/InfoTip";
import type { AiActionResult } from "@/server/actions/ai";
import { aiGenerateDiscretionaryInsight } from "@/server/actions/ai-discretionary";

export type { DiscretionaryAiInsightEntry };

interface DiscretionaryAiPanelProps {
  aiAvailable: boolean;
  context: string;
  period: string;
  year: number;
  month: number;
  canGenerate: boolean;
  insightHistory: DiscretionaryAiInsightEntry[];
}

export function DiscretionaryAiPanel({
  aiAvailable,
  context,
  period,
  year,
  month,
  canGenerate,
  insightHistory,
}: DiscretionaryAiPanelProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasHistory = insightHistory.length > 0;

  async function runGenerate(): Promise<void> {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result: AiActionResult = await aiGenerateDiscretionaryInsight({
      context,
      period,
      year,
      month,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
    window.location.reload();
  }

  const generateDisabled = loading || !aiAvailable || !canGenerate;

  return (
    <section className="section-card border-amber-200 bg-gradient-to-br from-amber-50/90 to-white">
      <h2 className="section-title">
        AI — głupoty i wydatki opcjonalne
        <InfoTip label="AI opcjonalne">
          Osobny raport tylko o kategoriach oznaczonych jako opcjonalne — nie miesza się z
          ogólną analizą na dashboardzie.
        </InfoTip>
      </h2>

      {!aiAvailable ? (
        <p className="mt-2 text-sm text-amber-900">
          Dodaj ANTHROPIC_API_KEY lub OPENAI_API_KEY w .env / Vercel, aby generować
          raport.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={generateDisabled}
          onClick={() => {
            void runGenerate();
          }}
        >
          {loading ? "Generuję…" : "Raport AI za ten okres"}
        </button>
      </div>

      {message ? <p className="alert-success mt-3">{message}</p> : null}
      {error ? <p className="alert-error mt-3">{error}</p> : null}

      {hasHistory ? <DiscretionaryAiHistory entries={insightHistory} /> : null}

      {!hasHistory && aiAvailable && canGenerate ? (
        <p className="mt-3 text-sm text-amber-900">
          Wygeneruj pierwszy raport — zapisze się w historii dla tego kontekstu.
        </p>
      ) : null}
    </section>
  );
}
