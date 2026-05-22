import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";

export interface SpendingSummaryForAi {
  periodLabel: string;
  totalExpenses: number;
  totalIncome: number;
  transactionCount: number;
  topCategories: { name: string; total: number; percent: number }[];
  topMerchants: { name: string; total: number; changePercent: number | null }[];
  uncategorizedCount: number;
}

const SYSTEM_PROMPT = `Jesteś doradcą finansowym dla pary prowadzącej JDG i budżet domowy w Polsce.
Na podstawie danych JSON napisz krótką analizę po polsku (markdown).
Struktura:
## Co widać
2-3 zdania o głównych trendach.

## Gdzie optymalizować
3-5 konkretnych punktów (kwoty gdzie możliwe). Bez ogólników.

## Jedna rzecz do zmiany w tym miesiącu
1 konkretna, wykonalna rada.

Ton: empatyczny, konkretny, bez moralizowania. Max 400 słów.`;

export async function generateSpendingInsights(
  config: AiConfig,
  summary: SpendingSummaryForAi,
  fetchFn?: FetchFn,
): Promise<string> {
  const user = `Dane za okres ${summary.periodLabel}:\n${JSON.stringify(summary, null, 2)}`;
  return completeWithAi(
    config,
    { system: SYSTEM_PROMPT, user, maxTokens: 1500 },
    fetchFn,
  );
}
