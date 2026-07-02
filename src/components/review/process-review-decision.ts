import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { applyReviewDecision } from "@/server/actions/review";

interface RowMessage {
  type: "success" | "error";
  text: string;
}

interface ProcessReviewDecisionInput {
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

function handleReviewFailure(
  input: ProcessReviewDecisionInput,
  errorMessage: string,
): void {
  input.setError(errorMessage);
  input.showBanner("error", errorMessage);
  input.setRowMessages((prev) => ({
    ...prev,
    [input.transactionId]: { type: "error", text: errorMessage },
  }));
}

function handleReviewSkip(input: ProcessReviewDecisionInput, message: string): void {
  input.setRowMessages((prev) => ({
    ...prev,
    [input.transactionId]: { type: "success", text: message },
  }));
  input.showBanner("success", message);
  window.setTimeout(() => {
    input.clearRowMessage(input.transactionId);
  }, 3000);
}

function handleReviewSaved(input: ProcessReviewDecisionInput): void {
  input.setHiddenIds((prev) => new Set(prev).add(input.transactionId));
  input.onResolved?.();
  input.showBanner("success", "Zapisano — usunięto z kolejki weryfikacji");
  input.router.refresh();
}

export async function processReviewDecision(
  input: ProcessReviewDecisionInput,
): Promise<void> {
  const result = await applyReviewDecision({
    transactionId: input.transactionId,
    decision: input.decision,
    categoryId: input.categoryId,
  });
  input.setPendingId(null);

  if (!result.ok) {
    handleReviewFailure(input, result.error);
    return;
  }

  if (input.decision === "skip") {
    handleReviewSkip(input, result.message);
    return;
  }

  handleReviewSaved(input);
}
