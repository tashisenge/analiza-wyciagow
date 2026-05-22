const DESCRIPTION_MARKERS = [
  /PRZELEW\s+WEWN[EĘ]TRZNY/i,
  /PRZELEW\s+WŁASNY/i,
  /PRZELEW\s+WLASNY/i,
  /PRZELEW\s+MI[EĘ]DZY\s+WŁASNYMI/i,
  /PRZELEW\s+MI[EĘ]DZY\s+WLASNYMI/i,
  /PRZELEW\s+NA\s+RACHUNEK\s+WŁASNY/i,
  /PRZELEW\s+NA\s+RACHUNEK\s+WLASNY/i,
  /TRANSFER\s+WEWN[EĘ]TRZNY/i,
] as const;

export interface InternalTransferInput {
  description: string;
  mbankCategory?: string;
}

export function isInternalTransfer(input: InternalTransferInput): boolean {
  const description = input.description.trim();
  if (!description) {
    return false;
  }
  return DESCRIPTION_MARKERS.some((pattern) => pattern.test(description));
}
