"use client";

import { useTransition } from "react";

import { updateAiProviderPreference } from "@/server/actions/ai-settings";

interface AiProviderSelectProps {
  preference: string;
  activeProvider: string | null;
  availableProviders: string[];
  disabled?: boolean;
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
}: AiProviderSelectProps): React.JSX.Element {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onChange={(event) => {
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(() => {
          void updateAiProviderPreference(data);
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
  );
}
