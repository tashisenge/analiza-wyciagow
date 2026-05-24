"use client";

import { useState, useTransition } from "react";

import { assignTagsToTransaction, createTag } from "@/server/actions/tags";

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TransactionTagsFormProps {
  transactionId: string;
  allTags: TagOption[];
  selectedTagIds: string[];
}

export function TransactionTagsForm({
  transactionId,
  allTags,
  selectedTagIds,
}: TransactionTagsFormProps): React.JSX.Element {
  const [selected, setSelected] = useState<string[]>(selectedTagIds);
  const [newTagName, setNewTagName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleTag(tagId: string): void {
    const next = selected.includes(tagId)
      ? selected.filter((id) => id !== tagId)
      : [...selected, tagId];
    setSelected(next);
    saveTags(next);
  }

  function saveTags(nextSelected: string[]): void {
    startTransition(async () => {
      const result = await assignTagsToTransaction(transactionId, nextSelected);
      setMessage(result.ok ? "Zapisano tagi" : (result.error ?? "Błąd"));
    });
  }

  function handleCreateTag(): void {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      return;
    }
    startTransition(async () => {
      const created = await createTag(trimmed);
      if (!created.ok || !created.id) {
        setMessage(created.error ?? "Nie udało się utworzyć tagu");
        return;
      }
      const nextSelected = [...selected, created.id];
      setSelected(nextSelected);
      setNewTagName("");
      await assignTagsToTransaction(transactionId, nextSelected);
      setMessage("Dodano tag");
    });
  }

  return (
    <div className="mt-2 space-y-2">
      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => {
            const active = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                disabled={isPending}
                onClick={() => {
                  toggleTag(tag.id);
                }}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "text-white" : "border border-calm-200 bg-white text-slate-700"
                }`}
                style={active ? { backgroundColor: tag.color } : undefined}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Brak tagów — utwórz pierwszy poniżej.</p>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={newTagName}
          onChange={(event) => {
            setNewTagName(event.target.value);
          }}
          placeholder="Nowy tag"
          className="w-full rounded border border-calm-200 px-2 py-1 text-xs"
        />
        <button
          type="button"
          disabled={isPending || !newTagName.trim()}
          onClick={handleCreateTag}
          className="rounded bg-brand-600 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          +
        </button>
      </div>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
