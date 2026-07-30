export interface TransferPartnerBackfillInput {
  workspaceId: string;
  transferCategoryId: string | null | undefined;
  existingPartnerHashes: Set<string>;
}

export interface TransferPartnerBackfillUpdate {
  where: {
    workspaceId: string;
    dedupeHash: { in: string[] };
    NOT: { categoryId: string };
  };
  data: { categoryId: string };
}

export function buildTransferPartnerBackfillUpdate(
  input: TransferPartnerBackfillInput,
): TransferPartnerBackfillUpdate | null {
  if (!input.transferCategoryId || input.existingPartnerHashes.size === 0) {
    return null;
  }
  return {
    where: {
      workspaceId: input.workspaceId,
      dedupeHash: { in: [...input.existingPartnerHashes] },
      NOT: { categoryId: input.transferCategoryId },
    },
    data: { categoryId: input.transferCategoryId },
  };
}
