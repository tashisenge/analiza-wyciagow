import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

export {
  normalizeMbankCategoryName,
  uniqueMbankCategoryNames,
} from "@/lib/mbank/category-names";

export function resolveCategoryIdByName(
  categoryName: string,
  categoriesByName: Map<string, string>,
): string | null {
  return categoriesByName.get(categoryName) ?? null;
}

/** Dokładne mapowanie nazw mBank → kanoniczna kategoria aplikacji. */
const MBANK_TO_APP_EXACT: Record<string, string> = {
  "Żywność i chemia domowa": "Żywność",
  "Żywność": "Żywność",
  "Przejazdy": "Transport",
  "Komunikacja": "Transport",
  "Paliwo": "Transport",
  "Transport": "Transport",
  "Rachunki": "Mieszkanie",
  "Czynsz": "Mieszkanie",
  "Media": "Mieszkanie",
  "Mieszkanie": "Mieszkanie",
  "Rozrywka": "Rozrywka",
  "Kultura": "Rozrywka",
  "Restauracje": "Rozrywka",
  "Zdrowie": "Zdrowie",
  "Uroda": "Zdrowie",
  "Wynagrodzenie": "Przychód",
  "Przychód": "Przychód",
  "Przelewy": "Inne",
  "Opłaty bankowe": "Inne",
  "Odzież": "Inne",
  "Edukacja": "Inne",
  "Inne": "Inne",
  "Podatki": "Podatki (firma)",
  "Składki ZUS": "ZUS (firma)",
  "ZUS": "ZUS (firma)",
  "Księgowość": "KUP (firma)",
  "Zakup sprzętu": "KUP (firma)",
  "KUP": "KUP (firma)",
};

/** Wzorce częściowe (lowercase) → kanoniczna kategoria. */
const MBANK_TO_APP_CONTAINS: [string, string][] = [
  ["podatk", "Podatki (firma)"],
  ["skarbow", "Podatki (firma)"],
  ["zus", "ZUS (firma)"],
  ["księgow", "KUP (firma)"],
  ["wynagrodz", "Przychód"],
  ["czynsz", "Mieszkanie"],
  ["rachun", "Mieszkanie"],
  ["media", "Mieszkanie"],
  ["energi", "Mieszkanie"],
  ["internet", "Mieszkanie"],
  ["telefon", "Mieszkanie"],
  ["paliwo", "Transport"],
  ["komunik", "Transport"],
  ["przejazd", "Transport"],
  ["żywno", "Żywność"],
  ["chemia", "Żywność"],
  ["restaur", "Rozrywka"],
  ["kino", "Rozrywka"],
  ["netflix", "Rozrywka"],
  ["spotify", "Rozrywka"],
  ["zdrow", "Zdrowie"],
  ["aptek", "Zdrowie"],
  ["lekarz", "Zdrowie"],
];

/**
 * Mapuje surową nazwę kategorii mBank na kanoniczną kategorię aplikacji.
 * Nieznane nazwy trafiają do „Inne” zamiast tworzyć osobną kategorię.
 */
export function mapMbankCategoryToAppName(mbankCategory: string): string | null {
  const normalized = normalizeMbankCategoryName(mbankCategory);
  if (!normalized) {
    return null;
  }

  const exact = MBANK_TO_APP_EXACT[normalized];
  if (exact) {
    return exact;
  }

  const lower = normalized.toLowerCase();
  for (const [pattern, appName] of MBANK_TO_APP_CONTAINS) {
    if (lower.includes(pattern)) {
      return appName;
    }
  }

  return "Inne";
}
