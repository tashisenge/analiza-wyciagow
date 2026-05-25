"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  readErrorPopupEnabledFromStorage,
  writeErrorPopupEnabledToStorage,
} from "@/lib/ui/error-popup-storage";

interface ErrorPopupContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ErrorPopupContext = createContext<ErrorPopupContextValue | null>(null);

export function ErrorPopupProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(readErrorPopupEnabledFromStorage());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    writeErrorPopupEnabledToStorage(value);
  }, []);

  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

  return (
    <ErrorPopupContext.Provider value={value}>{children}</ErrorPopupContext.Provider>
  );
}

export function useErrorPopup(): ErrorPopupContextValue {
  const context = useContext(ErrorPopupContext);
  if (!context) {
    throw new Error("useErrorPopup wymaga ErrorPopupProvider");
  }
  return context;
}
