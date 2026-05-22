const CARD_PURCHASE_MARKERS = [
  " ZAKUP PRZY UŻYCIU KARTY",
  " ZAKUP PRZY UZYCIU KARTY",
] as const;

/**
 * Wyciąga nazwę kontrahenta z opisu operacji mBank (kolumna „Opis operacji”).
 */
export function extractMerchantFromDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return "";
  }

  for (const marker of CARD_PURCHASE_MARKERS) {
    const index = trimmed.indexOf(marker);
    if (index > 0) {
      return trimmed.slice(0, index).trim();
    }
  }

  const commaIndex = trimmed.indexOf(",");
  if (commaIndex > 0) {
    return trimmed.slice(0, commaIndex).trim();
  }

  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord ?? trimmed;
}
