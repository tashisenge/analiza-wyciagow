"use client";

import { PrivacyAmountsProvider } from "@/components/privacy/PrivacyAmountsProvider";
import { PrivacyPresentationBanner } from "@/components/privacy/PrivacyPresentationBanner";
import { ErrorPopupProvider } from "@/components/ui/ErrorPopupProvider";

export function AppPrivacyShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <PrivacyAmountsProvider>
      <ErrorPopupProvider>
        <PrivacyPresentationBanner />
        {children}
      </ErrorPopupProvider>
    </PrivacyAmountsProvider>
  );
}
