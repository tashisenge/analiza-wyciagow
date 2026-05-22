"use client";

import { useState } from "react";

import { MarkdownInsight } from "@/components/ai/MarkdownInsight";

export interface AiInsightHistoryEntry {
  id: string;
  context: string;
  provider: string;
  contentMarkdown: string;
  transfersFiltered: number;
  excludedTxCount: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyInsightButton({ text }: { text: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn-secondary px-2 py-1 text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        });
      }}
    >
      {copied ? "Skopiowano" : "Kopiuj"}
    </button>
  );
}

export function AiInsightHistory({
  entries,
  initialSelectedId,
}: {
  entries: AiInsightHistoryEntry[];
  initialSelectedId?: string | null;
}): React.JSX.Element | null {
  if (entries.length === 0) {
    return null;
  }

  const [selectedId, setSelectedId] = useState(
    initialSelectedId ?? entries[0]?.id ?? null,
  );
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

  if (!selected) {
    return null;
  }

  const meta =
    selected.transfersFiltered > 0 || selected.excludedTxCount > 0
      ? `Odfiltrowano: ${String(selected.transfersFiltered)} transferów, ${String(selected.excludedTxCount)} z wykluczonych kategorii`
      : null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-brand-900">Historia analiz</h3>
        <CopyInsightButton text={selected.contentMarkdown} />
      </div>
      <select
        className="input-field text-xs"
        value={selectedId ?? ""}
        onChange={(event) => {
          setSelectedId(event.target.value);
        }}
      >
        {entries.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {formatDate(entry.createdAt)} · {entry.context} · {entry.provider}
          </option>
        ))}
      </select>
      {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft">
        <MarkdownInsight content={selected.contentMarkdown} />
      </div>
    </div>
  );
}
