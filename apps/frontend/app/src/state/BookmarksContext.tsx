import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "./AuthContext";

export interface Bookmark {
  lab: number;
  key: string;
  title: string;
}

interface BookmarksContextValue {
  bookmarks: Bookmark[];
  /** True once the first fetch has settled, so "no bookmarks" can be told apart from "not loaded yet". */
  loaded: boolean;
  has: (lab: number, key: string) => boolean;
  toggle: (lab: number, key: string, title: string) => void;
}

/** Topic keys are positional: `s2` is the 3rd body section, `s2e1` its 2nd example. */
export const sectionKey = (sectionIndex: number) => `s${sectionIndex}`;
export const exampleKey = (sectionIndex: number, exampleIndex: number) => `s${sectionIndex}e${exampleIndex}`;
export const topicDomId = (lab: number, key: string) => `topic-${lab}-${key}`;

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Bookmark[]>("/bookmarks", { token })
      .then((rows) => {
        if (cancelled) return;
        setBookmarks(rows);
        setLoaded(true);
      })
      .catch(() => {
        // Bookmarks are a convenience; the manual still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const has = useCallback((lab: number, key: string) => bookmarks.some((b) => b.lab === lab && b.key === key), [bookmarks]);

  const toggle = useCallback(
    (lab: number, key: string, title: string) => {
      const existing = bookmarks.some((b) => b.lab === lab && b.key === key);
      // Optimistic update; roll back if the server rejects it.
      const rollback = bookmarks;
      // Only one bookmark is kept: a new one replaces the previous.
      setBookmarks(existing ? [] : [{ lab, key, title }]);
      const request = existing
        ? apiFetch<null>(`/bookmarks/${lab}/${encodeURIComponent(key)}`, { method: "DELETE", token })
        : apiFetch<Bookmark>("/bookmarks", { method: "PUT", body: { lab, key, title }, token });
      request.catch(() => setBookmarks(rollback));
    },
    [bookmarks, token]
  );

  const value = useMemo(() => ({ bookmarks, loaded, has, toggle }), [bookmarks, loaded, has, toggle]);
  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within a BookmarksProvider");
  return ctx;
}
