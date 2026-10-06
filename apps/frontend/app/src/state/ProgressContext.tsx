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

  const inFlightRef = useRef(0);

  const persist = useCallback(
    (next: Progress) => {
      setProgress(next);
      // Fire-and-forget: a failed save just means it'll be retried on the next change.
      // A future retry/backoff layer can slot in behind ProgressStore without touching this.
      inFlightRef.current++;
      void store
        .setProgress(next)
        .catch((err) => console.error("Failed to save progress", err))
        .finally(() => {
          inFlightRef.current--;
        });
    },
    [store]
  );

  // Keep the UI in sync with the backend: re-pull when the tab regains focus / periodically.
  // Only done/hint data is merged — the current lab is left alone so the sandbox isn't pulled
  // out from under the user.
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible" || inFlightRef.current > 0) return;
      store
        .getProgress()
        .then((remote) => {
          if (inFlightRef.current > 0) return; // a local save started meanwhile; don't clobber it
          setProgress((cur) => ({ ...cur, done: remote.done, hintIdx: remote.hintIdx }));
        })
        .catch(() => {});
    };
    const timer = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [store]);

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
