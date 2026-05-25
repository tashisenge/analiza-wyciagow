import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readErrorPopupEnabledFromStorage,
  writeErrorPopupEnabledToStorage,
} from "@/lib/ui/error-popup-storage";

describe("error-popup-storage", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      clear: () => {
        storage.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to enabled when storage is empty", () => {
    expect(readErrorPopupEnabledFromStorage()).toBe(true);
  });

  it("persists disabled state", () => {
    writeErrorPopupEnabledToStorage(false);
    expect(readErrorPopupEnabledFromStorage()).toBe(false);
    expect(storage.get("analiza-error-popup-enabled")).toBe("0");
  });

  it("persists enabled state", () => {
    writeErrorPopupEnabledToStorage(true);
    expect(readErrorPopupEnabledFromStorage()).toBe(true);
  });
});
