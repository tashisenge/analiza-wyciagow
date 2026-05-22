export interface FormatDisplayAmountOptions {
  decimals?: number;
  suffix?: string;
}

export function formatDisplayAmount(
  value: number,
  options?: FormatDisplayAmountOptions,
): string {
  const decimals = options?.decimals ?? 2;
  const suffix = options?.suffix ?? " PLN";
  const formatted = Number.isFinite(value) ? value.toFixed(decimals) : "0.00";
  return `${formatted}${suffix}`;
}

export function formatMaskedAmount(options?: FormatDisplayAmountOptions): string {
  const suffix = options?.suffix ?? " PLN";
  return `••••••${suffix}`;
}
