"use client";

import { useState } from "react";

import type { DiscretionaryAiInsightEntry } from "./discretionary-ai-types";

import { MarkdownInsight } from "@/components/ai/MarkdownInsight";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DiscretionaryAiHistory({
  entries,
}: {
  entries: DiscretionaryAiInsightEntry[];
}): React.JSX.Element {
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];
  if (!selected) {
    return <></>;
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="font-semibold text-amber-950">Historia raportów</h3>
      <select
        className="input-field text-xs"
        value={selectedId}
        onChange={(event) => {
          setSelectedId(event.target.value);
        }}
      >
        {entries.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {formatDate(entry.createdAt)} · {entry.periodLabel} · {entry.context}
          </option>
        ))}
      </select>
      <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-soft">
        <MarkdownInsight content={selected.contentMarkdown} />
      </div>
    </div>
  );
}
