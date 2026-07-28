"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface ActiveGuard {
  id: string;
  name: string;
  token: string;
  expiresAt: number; // epoch ms
}

interface GuardSessionContextType {
  activeGuard: ActiveGuard | null;
  setActiveGuard: (guard: ActiveGuard) => void;
  clearActiveGuard: () => void;
}

const GuardSessionContext = createContext<GuardSessionContextType | null>(null);
const STORAGE_KEY = "active_guard_session";

export function useGuardSession() {
  const ctx = useContext(GuardSessionContext);
  if (!ctx)
    throw new Error("useGuardSession must be used inside GuardSessionProvider");
  return ctx;
}

export function GuardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeGuard, setActiveGuardState] = useState<ActiveGuard | null>(null);

  // Restore on mount — sessionStorage survives a refresh but clears when the
  // kiosk browser tab actually closes, which is the right lifetime for this.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ActiveGuard = JSON.parse(raw);
        if (parsed.expiresAt > Date.now()) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveGuardState(parsed);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore malformed/missing storage
    }
  }, []);

  const setActiveGuard = useCallback((guard: ActiveGuard) => {
    setActiveGuardState(guard);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guard));
  }, []);

  const clearActiveGuard = useCallback(() => {
    setActiveGuardState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <GuardSessionContext.Provider
      value={{ activeGuard, setActiveGuard, clearActiveGuard }}
    >
      {children}
    </GuardSessionContext.Provider>
  );
}
