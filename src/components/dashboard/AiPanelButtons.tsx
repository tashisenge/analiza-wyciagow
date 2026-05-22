"use client";

import {
  aiCategorizeUncategorized,
  aiGenerateInsights,
  applyMbankMapping,
  type AiActionResult,
} from "@/server/actions/ai";

interface AiPanelButtonsProps {
  aiAvailable: boolean;
  aiTargetCount: number;
  context: string;
  busy: boolean;
  loading: string | null;
  onRun: (
    action: () => Promise<AiActionResult>,
    label: string,
    reloadOnSuccess: boolean,
  ) => void;
}

export function AiPanelButtons({
  aiAvailable,
  aiTargetCount,
  context,
  busy,
  loading,
  onRun,
}: AiPanelButtonsProps): React.JSX.Element {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          onRun(applyMbankMapping, "map", true);
        }}
        className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {loading === "map" ? "…" : "Przypisz kategorie mBank (1:1, darmowe)"}
      </button>
      <button
        type="button"
        disabled={busy || !aiAvailable || aiTargetCount === 0}
        title={
          !aiAvailable
            ? "Brak klucza API w .env"
            : aiTargetCount === 0
              ? "Brak transakcji bez kategorii lub w «Bez kategorii»"
              : undefined
        }
        onClick={() => {
          onRun(aiCategorizeUncategorized, "cat", true);
        }}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading === "cat" ? "…" : `Kategoryzuj AI (${String(aiTargetCount)})`}
      </button>
      <button
        type="button"
        disabled={busy || !aiAvailable}
        title={!aiAvailable ? "Brak klucza API w .env" : undefined}
        onClick={() => {
          onRun(() => aiGenerateInsights(context), "insight", false);
        }}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading === "insight" ? "…" : "Analiza AI (ten miesiąc)"}
      </button>
    </div>
  );
}
