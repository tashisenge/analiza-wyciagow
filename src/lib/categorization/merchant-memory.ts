export interface MerchantMemoryInput {
  counterparty: string;
  categoryId: string;
}

export function resolveMerchantCategory(
  counterparty: string,
  memories: MerchantMemoryInput[],
): string | null {
  const key = counterparty.trim().toLowerCase();
  const hit = memories.find((m) => m.counterparty.trim().toLowerCase() === key);
  return hit?.categoryId ?? null;
}
