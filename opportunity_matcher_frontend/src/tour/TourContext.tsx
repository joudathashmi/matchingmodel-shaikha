import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type TourContextValue = {
  /** Open welcome, then run the spotlight tour */
  startTour: (opts?: { force?: boolean }) => void;
  /** Internal: GuidedTour registers its runner */
  registerRunner: (fn: ((opts?: { force?: boolean }) => void) | null) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const runnerRef = useRef<((opts?: { force?: boolean }) => void) | null>(null);
  const [ready, setReady] = useState(0);

  const registerRunner = useCallback(
    (fn: ((opts?: { force?: boolean }) => void) | null) => {
      runnerRef.current = fn;
      setReady((n) => n + 1);
    },
    []
  );

  const startTour = useCallback((opts?: { force?: boolean }) => {
    if (runnerRef.current) {
      runnerRef.current(opts);
    } else {
      // Runner not mounted yet (e.g. still on login) - mark pending
      try {
        localStorage.setItem("rhq.tour.pending", "1");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo(
    () => ({ startTour, registerRunner }),
    [startTour, registerRunner, ready]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent */
export function useTourOptional() {
  return useContext(TourContext);
}
