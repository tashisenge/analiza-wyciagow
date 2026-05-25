"use client";

import { useErrorPopup } from "@/components/ui/ErrorPopupProvider";

export function ErrorPopupToggle(): React.JSX.Element {
  const { enabled, setEnabled } = useErrorPopup();

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          setEnabled(event.target.checked);
        }}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="font-medium text-slate-900">Popup przy błędach zapisu</span>
        <span className="mt-0.5 block text-sm text-slate-600">
          Wyświetla okno z komunikatem błędu na stronie transakcji (zapis w tej
          przeglądarce).
        </span>
      </span>
    </label>
  );
}
