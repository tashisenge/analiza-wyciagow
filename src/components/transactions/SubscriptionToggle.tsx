"use client";

import { useTransition } from "react";

import {
  markCounterpartyAsSubscription,
  unmarkCounterpartySubscription,
} from "@/server/actions/subscriptions";

interface SubscriptionToggleProps {
  counterparty: string;
  isMarked: boolean;
}

export function SubscriptionToggle({
  counterparty,
  isMarked,
}: SubscriptionToggleProps): React.JSX.Element | null {
  const [isPending, startTransition] = useTransition();

  if (!counterparty.trim()) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          if (isMarked) {
            await unmarkCounterpartySubscription(counterparty);
          } else {
            await markCounterpartyAsSubscription(counterparty);
          }
        });
      }}
      className={`mt-1 rounded px-2 py-0.5 text-xs ${
        isMarked
          ? "bg-brand-100 text-brand-800"
          : "border border-calm-200 bg-white text-slate-600"
      } disabled:opacity-50`}
      title={
        isMarked
          ? "Usuń oznaczenie subskrypcji dla tego kontrahenta"
          : "Oznacz kontrahenta jako subskrypcję"
      }
    >
      {isMarked ? "★ Subskrypcja" : "☆ Oznacz subskrypcję"}
    </button>
  );
}
