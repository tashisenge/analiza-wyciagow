export function scopedTransactionUpdate(
  workspaceId: string,
  transactionId: string,
  categoryId: string,
): {
  where: { id: string; workspaceId: string };
  data: { categoryId: string };
} {
  return {
    where: { id: transactionId, workspaceId },
    data: { categoryId },
  };
}

export function isTransactionInCandidateScope(
  transactionId: string,
  candidateTransactionIds: string[] | undefined,
): boolean {
  return (
    candidateTransactionIds === undefined ||
    candidateTransactionIds.includes(transactionId)
  );
}
