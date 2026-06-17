import type { DetectedOpportunity } from "@/lib/optimization/types";

export function buildDedupeKey(
  opportunity: DetectedOpportunity,
  monthKey: string,
  accountContext: "firma" | "dom" | "razem",
): string {
  const base = opportunity.dedupeKey;
  return `${accountContext}:${base}:${monthKey}`;
}

export function buildLegacyDedupeKey(
  opportunity: DetectedOpportunity,
  monthKey: string,
): string {
  const base = opportunity.dedupeKey;
  return `${base}:${monthKey}`;
}

export function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${String(year)}-${month}`;
}
