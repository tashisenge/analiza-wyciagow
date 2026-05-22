import type { DetectedOpportunity } from "@/lib/optimization/types";

const SUBSCRIPTION_KEYWORDS = [
  "NETFLIX",
  "SPOTIFY",
  "GOOGLE",
  "ADOBE",
  "APPLE",
  "MICROSOFT",
  "DISNEY",
  "HBO",
  "CANAL",
  "YOUTUBE",
  "PRIME",
  "OPENAI",
  "CHATGPT",
];

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000);
}

function hasSubscriptionCadence(dates: Date[]): boolean {
  if (dates.length < 2) {
    return false;
  }
  const sorted = [...dates].sort((left, right) => left.getTime() - right.getTime());
  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const current = sorted[index];
    if (!prev || !current) {
      continue;
    }
    const gap = daysBetween(current, prev);
    if (gap >= 28 && gap <= 35) {
      return true;
    }
  }
  return false;
}

function matchesKeyword(counterparty: string): boolean {
  const upper = counterparty.toUpperCase();
  return SUBSCRIPTION_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function toSubscription(item: DetectedOpportunity): DetectedOpportunity {
  const counterparty = item.counterparty ?? "Subskrypcja";
  return {
    ...item,
    type: "SUBSCRIPTION",
    title: `Subskrypcja: ${counterparty}`,
    description: `Cykliczna opłata — ${item.description}`,
    dedupeKey: `SUBSCRIPTION:${counterparty}`,
  };
}

export function detectSubscriptionsFromDates(
  recurring: DetectedOpportunity[],
  bookedDatesById: Map<string, Date>,
): DetectedOpportunity[] {
  return recurring
    .filter((item) => {
      const counterparty = item.counterparty ?? "";
      if (matchesKeyword(counterparty)) {
        return true;
      }
      const dates = item.evidenceTransactionIds
        .map((id) => bookedDatesById.get(id))
        .filter((date): date is Date => date !== undefined);
      return hasSubscriptionCadence(dates);
    })
    .map(toSubscription);
}
