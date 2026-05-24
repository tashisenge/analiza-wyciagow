"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateAiProviderPreference } from "@/server/actions/ai-settings";

interface AiProviderSelectProps {
  preference: string;
  activeProvider: string | null;
  availableProviders: string[];
  disabled?: boolean;
  showFeedback?: boolean;
}

const LABELS: Record<string, string> = {
  auto: "Auto (z .env)",
  anthropic: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
};

export function AiProviderSelect({
  preference,
  activeProvider,
  availableProviders,
  disabled,
  showFeedback = false,
}: AiProviderSelectProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        className="flex flex-wrap items-center gap-2"
        onChange={(event) => {
          const form = event.currentTarget;
          const data = new FormData(form);
          startTransition(async () => {
            setMessage(null);
            setError(null);
            const result = await updateAiProviderPreference(data);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (showFeedback) {
              const pref = data.get("preference");
              const key = typeof pref === "string" ? pref : "auto";
              setMessage(`Zapisano: ${LABELS[key] ?? key}`);
            }
            router.refresh();
          });
        }}
      >
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Model AI
        </label>
        <select
          name="preference"
          defaultValue={preference}
          disabled={(disabled ?? false) || pending}
          className="input-field w-auto min-w-[10rem] text-xs"
        >
          <option value="auto">{LABELS["auto"]}</option>
          {availableProviders.includes("anthropic") ? (
            <option value="anthropic">{LABELS["anthropic"]}</option>
          ) : null}
          {availableProviders.includes("openai") ? (
            <option value="openai">{LABELS["openai"]}</option>
          ) : null}
        </select>
        {activeProvider ? (
          <span className="text-xs text-brand-700">
            Aktywny: <strong>{activeProvider}</strong>
            {pending ? " …" : null}
          </span>
        ) : null}
      </form>
      {showFeedback && message ? (
        <p className="alert-success mt-2 text-sm">{message}</p>
      ) : null}
      {showFeedback && error ? <p className="alert-error mt-2 text-sm">{error}</p> : null}
    </div>
  );
}
