const PALETTE = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#6366f1",
  "#ef4444",
  "#64748b",
] as const;

export function colorForMbankCategory(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % PALETTE.length;
  }
  return PALETTE[hash] ?? PALETTE[0];
}
