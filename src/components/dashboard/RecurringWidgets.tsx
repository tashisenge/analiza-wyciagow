import Link from "next/link";

import { AmountValue } from "@/components/privacy/AmountValue";
import type {
  RecurringPaymentRow,
  SubscriptionSummaryRow,
} from "@/lib/analytics/dashboard-extras";

interface RecurringPaymentsWidgetProps {
  context: string;
  payments: RecurringPaymentRow[];
}

export function RecurringPaymentsWidget({
  context,
  payments,
}: RecurringPaymentsWidgetProps): React.JSX.Element | null {
  if (payments.length === 0) {
    return null;
  }

  return (
    <section className="section-card border-amber-200 bg-amber-50/50">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title text-amber-900">Wykryte powtarzalne płatności</h2>
        <Link href={`/recurring?context=${context}`} className="link-brand text-sm">
          Wszystkie →
        </Link>
      </div>
      <p className="mt-1 text-sm text-amber-800">
        Na podstawie powtarzających się transakcji tego samego kontrahenta i kwoty.
      </p>
      <ul className="mt-3 space-y-2">
        {payments.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <div>
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-xs text-slate-600">
                {item.type === "SUBSCRIPTION" ? "subskrypcja" : "powtarzalna"}
              </span>
              {item.isMarkedSubscription ? (
                <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-800">
                  oznaczona
                </span>
              ) : null}
            </div>
            {item.estimatedMonthlySavings !== null ? (
              <span className="text-emerald-700">
                <AmountValue>
                  ~{item.estimatedMonthlySavings.toFixed(2)} PLN/mies.
                </AmountValue>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SubscriptionsWidgetProps {
  subscriptions: SubscriptionSummaryRow[];
}

export function SubscriptionsWidget({
  subscriptions,
}: SubscriptionsWidgetProps): React.JSX.Element | null {
  if (subscriptions.length === 0) {
    return null;
  }

  const monthlyTotal = subscriptions.reduce(
    (sum, item) => sum + (item.monthlyAmount ?? 0),
    0,
  );

  return (
    <section className="section-card border-brand-200 bg-brand-50/40">
      <h2 className="section-title text-brand-900">Twoje subskrypcje</h2>
      <p className="mt-1 text-sm text-brand-800">
        Kontrahenci oznaczeni ręcznie jako subskrypcje.
        {monthlyTotal > 0 ? (
          <>
            {" "}
            Szacunkowy koszt:{" "}
            <AmountValue className="font-medium">
              ~{monthlyTotal.toFixed(2)} PLN/mies.
            </AmountValue>
          </>
        ) : null}
      </p>
      <ul className="mt-3 space-y-2">
        {subscriptions.map((item) => (
          <li key={item.counterparty} className="flex justify-between gap-2 text-sm">
            <div>
              <span className="font-medium text-slate-900">{item.counterparty}</span>
              {item.note ? <p className="text-xs text-slate-500">{item.note}</p> : null}
            </div>
            {item.monthlyAmount !== null ? (
              <span className="whitespace-nowrap text-slate-700">
                <AmountValue>~{item.monthlyAmount.toFixed(2)} PLN</AmountValue>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
