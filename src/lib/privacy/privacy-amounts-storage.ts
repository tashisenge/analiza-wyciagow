export const PRIVACY_AMOUNTS_STORAGE_KEY = "analiza-hide-amounts";

export const PRIVACY_AMOUNTS_COOKIE = "privacy_hide_amounts";

export function readHideAmountsFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(PRIVACY_AMOUNTS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHideAmountsToStorage(hidden: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(PRIVACY_AMOUNTS_STORAGE_KEY, hidden ? "1" : "0");
  } catch {
    return;
  }
  document.documentElement.dataset["hideAmounts"] = hidden ? "1" : "0";
  document.cookie = `${PRIVACY_AMOUNTS_COOKIE}=${hidden ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
}
