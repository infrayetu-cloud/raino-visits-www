import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Server and client's first render must produce identical output, so this
  // can NEVER branch on `typeof window` inside the initializer — window
  // already exists by the time React hydrates on the client, so that check
  // would return true there and immediately diverge from the server's null.
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Runs only after hydration — safe to touch localStorage here.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      // ignore malformed/missing storage
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(error);
        }
        return valueToStore;
      });
    },
    [key],
  );

  // Expose `hydrated` in case a caller wants to distinguish "definitely no
  // user" from "haven't checked localStorage yet" (see AuthProvider note below).
  return [storedValue, setValue, hydrated] as const;
}
