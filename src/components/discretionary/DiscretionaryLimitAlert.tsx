import { AmountValue } from "@/components/privacy/AmountValue";
import {
  discretionaryLimitOverrunMessage,
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
  if (
    !isDiscretionaryLimitOverrun(limitUsedPercent) ||
    monthlyLimit === null ||
    limitUsedPercent === null
  ) {
    return null;
  }

  return (
    <p className="alert-warning text-sm" role="status">
      {discretionaryLimitOverrunMessage(limitUsedPercent, monthlyLimit, totalPln)}{" "}
      <AmountValue>
        ({totalPln.toFixed(2)} / {monthlyLimit.toFixed(2)} PLN)
      </AmountValue>
    </p>
  );
}
