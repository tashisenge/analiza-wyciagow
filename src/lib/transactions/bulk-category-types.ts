import type { AccountContext } from "@prisma/client";

export const BULK_CATEGORY_MAX = 500;

export interface BulkCategoryFilters {
  /** Fragment kontrahenta (case-insensitive contains) */
  counterpartyContains?: string;
  /** Dokładna nazwa kategorii mBank (po normalizacji) */
  mbankCategory?: string;
  /** Tylko transakcje bez categoryId */
  uncategorizedOnly?: boolean;
  /** Tylko transakcje z kategorii opcjonalnych */
  discretionaryOnly?: boolean;
  /** Transakcje przypisane do konkretnej kategorii */
  categoryId?: string;
  /** Transakcje przypisane do kategorii o nazwie */
  categoryName?: string;
  /** Transakcje oznaczone konkretnym tagiem */
  tagId?: string;
  /** Zakres dat inclusive (ISO date YYYY-MM-DD) */
  dateFrom?: string;
  dateTo?: string;
  /** Kontekst kont: firma | dom | razem */
  context?: AccountContext;
}

export interface BulkCategoryPreviewResult {
  count: number;
  capped: boolean;
  sampleIds: string[];
}

export interface BulkCategoryApplyResult {
  updatedCount: number;
  rememberedMerchants: number;
}
