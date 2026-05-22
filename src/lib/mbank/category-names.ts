/** Nazwa kategorii mBank gotowa do zapisu w Category / categoryId. */
export function normalizeMbankCategoryName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase() === "bez kategorii") {
    return null;
  }
  return trimmed;
}

export function uniqueMbankCategoryNames(rawNames: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawNames) {
    const name = normalizeMbankCategoryName(raw);
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}
