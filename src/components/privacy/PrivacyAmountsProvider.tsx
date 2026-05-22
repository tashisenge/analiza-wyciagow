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
  readHideAmountsFromStorage,
  writeHideAmountsToStorage,
} from "@/lib/privacy/privacy-amounts-storage";

interface PrivacyAmountsContextValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
  toggle: () => void;
}

const PrivacyAmountsContext = createContext<PrivacyAmountsContextValue | null>(null);

export function PrivacyAmountsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [hidden, setHiddenState] = useState(false);

  useEffect(() => {
    const initial = readHideAmountsFromStorage();
    setHiddenState(initial);
    writeHideAmountsToStorage(initial);
  }, []);

  const setHidden = useCallback((value: boolean) => {
    setHiddenState(value);
    writeHideAmountsToStorage(value);
  }, []);

  const toggle = useCallback(() => {
    setHiddenState((prev) => {
      const next = !prev;
      writeHideAmountsToStorage(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ hidden, setHidden, toggle }),
    [hidden, setHidden, toggle],
  );

  return (
    <PrivacyAmountsContext.Provider value={value}>
      {children}
    </PrivacyAmountsContext.Provider>
  );
}

export function usePrivacyAmounts(): PrivacyAmountsContextValue {
  const context = useContext(PrivacyAmountsContext);
  if (!context) {
    throw new Error("usePrivacyAmounts wymaga PrivacyAmountsProvider");
  }
  return context;
}
