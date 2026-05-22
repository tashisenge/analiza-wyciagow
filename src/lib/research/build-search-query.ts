import { normalizeMerchant } from "@/lib/research/normalize-merchant";

export function buildSearchQuery(counterparty: string): string {
  const merchant = normalizeMerchant(counterparty);
  return `${merchant} tańsza alternatywa cennik Polska`;
}
