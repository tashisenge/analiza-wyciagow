import {
  TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
  TRANSFER_CATEGORY_COLOR,
} from "@/lib/transactions/transfer-category";

export interface DefaultCategoryDef {
  name: string;
  color: string;
  excludeFromOptimization: boolean;
  isDiscretionary: boolean;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategoryDef[] = [
  {
    name: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
    color: TRANSFER_CATEGORY_COLOR,
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "Żywność",
    color: "#22c55e",
    excludeFromOptimization: false,
    isDiscretionary: false,
  },
  {
    name: "Transport",
    color: "#3b82f6",
    excludeFromOptimization: false,
    isDiscretionary: false,
  },
  {
    name: "Mieszkanie",
    color: "#a855f7",
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "Rozrywka",
    color: "#f97316",
    excludeFromOptimization: false,
    isDiscretionary: true,
  },
  {
    name: "Zdrowie",
    color: "#ec4899",
    excludeFromOptimization: false,
    isDiscretionary: false,
  },
  {
    name: "KUP (firma)",
    color: "#64748b",
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "ZUS (firma)",
    color: "#475569",
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "Podatki (firma)",
    color: "#334155",
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "Przychód",
    color: "#10b981",
    excludeFromOptimization: true,
    isDiscretionary: false,
  },
  {
    name: "Inne",
    color: "#94a3b8",
    excludeFromOptimization: false,
    isDiscretionary: false,
  },
];

export const CANONICAL_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name);

export function isCanonicalCategoryName(name: string): boolean {
  return CANONICAL_CATEGORY_NAMES.includes(name);
}

export function excludeFromOptimizationForName(name: string): boolean {
  return (
    DEFAULT_CATEGORIES.find((c) => c.name === name)?.excludeFromOptimization ?? false
  );
}

export function isDiscretionaryForName(name: string): boolean {
  return DEFAULT_CATEGORIES.find((c) => c.name === name)?.isDiscretionary ?? false;
}
