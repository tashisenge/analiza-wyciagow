"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import type { BulkReviewDecision } from "@/lib/review/persist-bulk-review-decisions";
import { applyBulkReviewDecisions } from "@/server/actions/review";

interface CategoryOption {
  id: string;
  name: string;
}

interface ReviewBulkPanelProps {
  selectedIds: string[];
  categories: CategoryOption[];
  suggestions: Record<string, MbankVerifySuggestion>;
  onClearSelection: () => void;
  onResolved: () => void;
}

function suggestionsForIds(
  selectedIds: string[],
  suggestions: Record<string, MbankVerifySuggestion>,
): Record<string, MbankVerifySuggestion> {
  const entries = selectedIds.flatMap((id) => {
    const suggestion = suggestions[id];
    return suggestion ? [[id, suggestion] as const] : [];
  });
  return Object.fromEntries(entries);
}

export function ReviewBulkPanel({
  selectedIds,
  categories,
  suggestions,
  onClearSelection,
  onResolved,
}: ReviewBulkPanelProps): React.JSX.Element | null {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  if (selectedIds.length === 0) {
    return null;
  }

  const aiSuggestions = suggestionsForIds(selectedIds, suggestions);
  const aiCount = Object.keys(aiSuggestions).length;

  function runBulk(decision: BulkReviewDecision): void {
    setMessage(null);
    startTransition(async () => {
      const result = await applyBulkReviewDecisions({
        transactionIds: selectedIds,
        decision,
        categoryId: decision === "custom" ? categoryId : undefined,
        suggestions: decision === "ai" ? aiSuggestions : undefined,
      });

      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setMessage({ type: "success", text: result.message });
      onClearSelection();
      onResolved();
      router.refresh();
    });
  }

  return (
    <section className="section-card space-y-3 p-4">
      <h2 className="text-sm font-semibold text-slate-800">
        Operacje masowe ({String(selectedIds.length)} zaznaczonych, max 500)
      </h2>
      {message ? (
        <p className={message.type === "success" ? "alert-success text-sm" : "alert-error text-sm"}>
          {message.text}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} className="btn-secondary text-xs" onClick={() => { runBulk("mbank"); }}>Zaakceptuj mBank</button>
        <button type="button" disabled={pending} className="btn-secondary text-xs" onClick={() => { runBulk("app"); }}>Zaakceptuj app</button>
        <button type="button" disabled={pending || aiCount === 0} className="btn-secondary text-xs" onClick={() => { runBulk("ai"); }}>Zastosuj AI ({String(aiCount)})</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={categoryId} disabled={pending} onChange={(e) => { setCategoryId(e.target.value); }} className="input-field max-w-[14rem] text-xs" aria-label="Kategoria docelowa">
          <option value="">— wybierz kategorię —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="button" disabled={pending || !categoryId} className="btn-primary text-xs" onClick={() => { runBulk("custom"); }}>Ustaw kategorię</button>
        <button type="button" disabled={pending} className="text-xs text-slate-600 hover:underline" onClick={onClearSelection}>Odznacz wszystkie</button>
      </div>
    </section>
  );
}
