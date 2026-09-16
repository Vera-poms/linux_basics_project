import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LABS } from "../data/labs";
import { defaultProgress, type Progress, type ProgressStore } from "./progressStore";

interface ProgressContextValue {
  progress: Progress;
  currentLabIndex: number;
  isLoading: boolean;
  gotoLab: (index: number) => void;
  markLabDone: (labId: number, isDone: boolean) => void;
  revealNextHint: (labId: number) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children, store }: { children: ReactNode; store: ProgressStore }) {
  const [progress, setProgress] = useState<Progress>(defaultProgress());
  const [isLoading, setIsLoading] = useState(true);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    store
      .getProgress()
      .then((loaded) => {
        if (!cancelled) setProgress(loaded);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const persist = useCallback(
    (next: Progress) => {
      setProgress(next);
      // Fire-and-forget: a failed save just means it'll be retried on the next change.
      // A future retry/backoff layer can slot in behind ProgressStore without touching this.
      void store.setProgress(next).catch((err) => console.error("Failed to save progress", err));
    },
    [store]
  );

  const gotoLab = useCallback(
    (index: number) => {
      if (index < 0 || index >= LABS.length) return;
      persist({ ...progressRef.current, lab: index });
    },
    [persist]
  );

  const markLabDone = useCallback(
    (labId: number, isDone: boolean) => {
      const current = progressRef.current;
      if (!!current.done[labId] === isDone) return;
      persist({ ...current, done: { ...current.done, [labId]: isDone } });
    },
    [persist]
  );

  const revealNextHint = useCallback(
    (labId: number) => {
      const current = progressRef.current;
      const idx = current.hintIdx[labId] || 0;
      persist({ ...current, hintIdx: { ...current.hintIdx, [labId]: idx + 1 } });
    },
    [persist]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, currentLabIndex: progress.lab, isLoading, gotoLab, markLabDone, revealNextHint }),
    [progress, isLoading, gotoLab, markLabDone, revealNextHint]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}

export { defaultProgress };
