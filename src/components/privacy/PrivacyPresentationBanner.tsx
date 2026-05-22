"use client";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";

export function PrivacyPresentationBanner(): React.JSX.Element | null {
  const { hidden } = usePrivacyAmounts();
  if (!hidden) {
    return null;
  }
  return (
    <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      Tryb prezentacji — kwoty są zamaskowane i rozmyte.
    </p>
  );
}
