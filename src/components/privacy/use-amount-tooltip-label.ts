"use client";

import { usePrivacyAmounts } from "@/components/privacy/PrivacyAmountsProvider";
import { formatMaskedAmount } from "@/lib/privacy/format-display-amount";

export function useAmountTooltipLabel(
  suffix = " PLN",
): (value: number | string) => string {
  const { hidden } = usePrivacyAmounts();
  return (value: number | string) => {
    if (hidden) {
      return formatMaskedAmount({ suffix });
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return String(value);
    }
    return `${num.toFixed(2)}${suffix}`;
  };
}
