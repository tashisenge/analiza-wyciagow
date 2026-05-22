"use client";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";

export function PrivacyPresentationBanner(): React.JSX.Element | null {
  const { hidden } = usePrivacyAmounts();
  if (!hidden) {
    return null;
  }
  return (
    <p className="border-b border-accent-100 bg-gradient-to-r from-accent-50 to-brand-50 px-4 py-2.5 text-center text-sm text-accent-600">
      Tryb prezentacji — kwoty są zamaskowane i rozmyte. Kliknij „Pokaż kwoty” w menu.
    </p>
  );
}
