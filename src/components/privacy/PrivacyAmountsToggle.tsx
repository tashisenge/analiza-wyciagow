"use client";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";

interface PrivacyAmountsToggleProps {
  compact?: boolean;
}

export function PrivacyAmountsToggle({
  compact = false,
}: PrivacyAmountsToggleProps): React.JSX.Element {
  const { hidden, toggle } = usePrivacyAmounts();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium transition ${
          hidden ? "bg-accent-100 text-accent-600" : "text-slate-600 hover:bg-calm-100"
        }`}
        title={hidden ? "Pokaż kwoty" : "Ukryj kwoty (prezentacja)"}
      >
        {hidden ? "Pokaż kwoty" : "Ukryj kwoty"}
      </button>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={hidden}
        onChange={() => {
          toggle();
        }}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="font-medium text-slate-900">Tryb prezentacji</span>
        <span className="mt-0.5 block text-sm text-slate-600">
          Maskuje i bluruje kwoty w całej aplikacji (zapis w tej przeglądarce).
        </span>
      </span>
    </label>
  );
}
