"use client";

import { PrivacyAmountsProvider } from "@/components/privacy/PrivacyAmountsProvider";
import { PrivacyPresentationBanner } from "@/components/privacy/PrivacyPresentationBanner";

export function AppPrivacyShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <PrivacyAmountsProvider>
      <PrivacyPresentationBanner />
      {children}
    </PrivacyAmountsProvider>
  );
}
