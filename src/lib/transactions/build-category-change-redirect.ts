export function buildCategoryChangeRedirectUrl(
  returnTo: string,
  result: { ok: boolean; error?: string; updatedCount?: number },
  categoryId: string,
): string {
  if (!result.ok) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return `${returnTo}${separator}error=${encodeURIComponent(result.error ?? "Błąd")}`;
  }

  if (result.updatedCount && result.updatedCount > 1) {
    const separator = returnTo.includes("?") ? "&" : "?";
    const cleared = !categoryId.trim();
    const message = cleared
      ? `Usunięto kategorię z ${String(result.updatedCount)} transakcji.`
      : `Zaktualizowano ${String(result.updatedCount)} transakcji (w tym podobne).`;
    return `${returnTo}${separator}msg=${encodeURIComponent(message)}`;
  }

  return returnTo;
}
