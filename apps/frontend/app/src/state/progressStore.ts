import { apiFetch } from "../api/client";

export interface Progress {
  /** Index into LABS, not the lab's `id`. */
  lab: number;
  /** Keyed by lab id. */
  done: Record<number, boolean>;
  /** Keyed by lab id — how many hints have been revealed. */
  hintIdx: Record<number, number>;
}

export const defaultProgress = (): Progress => ({ lab: 0, done: {}, hintIdx: {} });

/**
 * Storage abstraction for lab progress, backed by the FastAPI /progress
 * endpoint (real user accounts now own persistence — see AuthContext).
 * Async by nature since it goes over the network.
 */
export interface ProgressStore {
  getProgress(): Promise<Progress>;
  setProgress(progress: Progress): Promise<void>;
}

interface ProgressPayload {
  lab: number;
  done: Record<string, boolean>;
  hintIdx: Record<string, number>;
}

function fromPayload(payload: ProgressPayload): Progress {
  const toNumberKeys = (o: Record<string, boolean | number>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [Number(k), v]));
  return {
    lab: payload.lab,
    done: toNumberKeys(payload.done) as Record<number, boolean>,
    hintIdx: toNumberKeys(payload.hintIdx) as Record<number, number>,
  };
}

function toPayload(progress: Progress): ProgressPayload {
  const toStringKeys = (o: Record<number, boolean | number>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [String(k), v]));
  return {
    lab: progress.lab,
    done: toStringKeys(progress.done) as Record<string, boolean>,
    hintIdx: toStringKeys(progress.hintIdx) as Record<string, number>,
  };
}

export function apiProgressStore(getToken: () => string | null): ProgressStore {
  return {
    async getProgress() {
      const token = getToken();
      if (!token) return defaultProgress();
      const payload = await apiFetch<ProgressPayload>("/progress", { token });
      return fromPayload(payload);
    },
    async setProgress(progress) {
      const token = getToken();
      if (!token) return;
      await apiFetch<ProgressPayload>("/progress", { method: "PUT", body: toPayload(progress), token });
    },
  };
}
