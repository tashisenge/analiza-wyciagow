/**
 * Clears bulk row selection when the transactions list identity changes.
 * Soft navigations keep client state across pagination/filter URL changes;
 * without this reset, bulk category updates can rewrite hidden previous-page rows.
 */
export function selectedIdsForListKey(
  selectedIds: string[],
  previousListKey: string | null,
  nextListKey: string,
): string[] {
  if (previousListKey !== null && previousListKey !== nextListKey) {
    return [];
  }
  return selectedIds;
}
