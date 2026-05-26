import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { processReviewDecision } from "@/components/review/process-review-decision";

interface RowMessage {
  type: "success" | "error";
  text: string;
}

interface StartReviewDecisionInput {
  transactionId: string;
  decision: "mbank" | "app" | "custom" | "skip";
  categoryId?: string;
  router: AppRouterInstance;
  onResolved?: () => void;
  setPendingId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setBanner: (banner: { type: "success" | "error"; text: string } | null) => void;
  setRowMessages: React.Dispatch<React.SetStateAction<Record<string, RowMessage>>>;
  setHiddenIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearRowMessage: (transactionId: string) => void;
  showBanner: (type: "success" | "error", text: string) => void;
}

export function startReviewDecision(input: StartReviewDecisionInput): void {
  input.setError(null);
  input.setBanner(null);
  input.clearRowMessage(input.transactionId);
  input.setPendingId(input.transactionId);
  void processReviewDecision(input);
}
