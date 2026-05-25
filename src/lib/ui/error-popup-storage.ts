export const ERROR_POPUP_STORAGE_KEY = "analiza-error-popup-enabled";

export function readErrorPopupEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const value = localStorage.getItem(ERROR_POPUP_STORAGE_KEY);
    if (value == null) {
      return true;
    }
    return value === "1";
  } catch {
    return true;
  }
}

export function writeErrorPopupEnabledToStorage(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(ERROR_POPUP_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    return;
  }
}
