import { AmountValue } from "@/components/privacy/AmountValue";
import {
  discretionaryLimitApproachingMessage,
  discretionaryLimitOverrunMessage,
  isDiscretionaryLimitApproaching,
  isDiscretionaryLimitOverrun,
} from "@/lib/discretionary/limit-status";

interface DiscretionaryLimitAlertProps {
  totalPln: number;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
}

export function DiscretionaryLimitAlert({
  totalPln,
  monthlyLimit,
  limitUsedPercent,
}: DiscretionaryLimitAlertProps): React.JSX.Element | null {
  if (monthlyLimit === null || limitUsedPercent === null) {
    return null;
  }

  if (isDiscretionaryLimitOverrun(limitUsedPercent)) {
    return (
      <p className="alert-warning text-sm" role="status">
        {discretionaryLimitOverrunMessage(limitUsedPercent, monthlyLimit, totalPln)}{" "}
        <AmountValue>
          ({totalPln.toFixed(2)} / {monthlyLimit.toFixed(2)} PLN)
        </AmountValue>
      </p>
    );
  }

  if (isDiscretionaryLimitApproaching(limitUsedPercent)) {
    return (
      <p className="alert-warning text-sm" role="status">
        {discretionaryLimitApproachingMessage(limitUsedPercent, monthlyLimit, totalPln)}{" "}
        <AmountValue>
          ({totalPln.toFixed(2)} / {monthlyLimit.toFixed(2)} PLN)
        </AmountValue>
      </p>
    );
  }

  return null;
}
