import { useCallback, useMemo, useRef, useState } from "react";
import { Shell } from "../engine/runner";
import { HOME } from "../engine/filesystem";

export type LineVariant = "out" | "err" | "sys" | "good" | "warn";

export interface OutputEntry {
  id: number;
  kind: "line";
  variant: LineVariant;
  text: string;
}
export interface InputEntry {
  id: number;
  kind: "input";
  promptPath: string;
  command: string;
}
export type ScreenEntry = OutputEntry | InputEntry;

let nextId = 1;

/** Owns one Shell (virtual filesystem + parser/executor) and the console's scrollback. */
export function useShell() {
  const shellRef = useRef(new Shell());
  const [entries, setEntries] = useState<ScreenEntry[]>([]);
  const [version, setVersion] = useState(0);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const bump = () => setVersion((v) => v + 1);

  const promptPath = useCallback(() => {
    const cwd = shellRef.current.fs.cwd;
    return cwd === HOME ? "~" : cwd.startsWith(HOME + "/") ? "~" + cwd.slice(HOME.length) : cwd;
  }, []);

  const pushLine = useCallback((text: string, variant: LineVariant = "out") => {
    if (text === "") return;
    setEntries((prev) => [...prev, { id: nextId++, kind: "line", variant, text: text.replace(/\n$/, "") }]);
  }, []);

  const echoInput = useCallback(
    (command: string) => {
      setEntries((prev) => [...prev, { id: nextId++, kind: "input", promptPath: shellRef.current.heredoc ? ">" : promptPath(), command }]);
    },
    [promptPath]
  );

  const clearScreen = useCallback(() => setEntries([]), []);

  /** Runs one typed/clicked line through the shell (handles heredoc accumulation). */
  const submit = useCallback(
    (raw: string) => {
      const shell = shellRef.current;
      echoInput(raw);
      if (!shell.heredoc && raw.trim() === "") return;
      if (!shell.heredoc) shell.session.history.push(raw);
      setHistoryIndex(null);
      const res = shell.feedLine(raw);
      if ((res as { clear?: boolean }).clear) {
        clearScreen();
      } else {
        pushLine(res.out, "out");
        pushLine(res.err, "err");
      }
      bump();
      return res;
    },
    [echoInput, pushLine, clearScreen]
  );

  /** Resets the virtual filesystem and re-runs setup() for every lab up to and including `uptoIndex`. */
  const resetFs = useCallback((setupFns: Array<((fs: Shell["fs"]) => void) | undefined>, uptoIndex: number) => {
    shellRef.current.reset(() => {
      for (let i = 0; i <= uptoIndex; i++) setupFns[i]?.(shellRef.current.fs);
    });
    bump();
  }, []);

  /** Seeds fixtures for one lab (used on lab switch) without touching existing files. */
  const runSetup = useCallback((setupFn?: (fs: Shell["fs"]) => void) => {
    setupFn?.(shellRef.current.fs);
    bump();
  }, []);

  const historyUp = useCallback((currentValue: string): string => {
    const shell = shellRef.current;
    const hist = shell.session.history;
    if (!hist.length) return currentValue;
    const idx = historyIndex === null ? hist.length - 1 : Math.max(0, historyIndex - 1);
    setHistoryIndex(idx);
    return hist[idx];
  }, [historyIndex]);

  const historyDown = useCallback((): string => {
    const shell = shellRef.current;
    const hist = shell.session.history;
    if (historyIndex === null) return "";
    const idx = historyIndex + 1;
    if (idx >= hist.length) {
      setHistoryIndex(null);
      return "";
    }
    setHistoryIndex(idx);
    return hist[idx];
  }, [historyIndex]);

  const complete = useCallback((value: string): { value: string; matches: string[] } => {
    const shell = shellRef.current;
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1] || "";
    const slash = last.lastIndexOf("/");
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : "";
    const frag = slash >= 0 ? last.slice(slash + 1) : last;
    const node = shell.fs.getNode(shell.fs.resolve(dirPart || "."));
    if (!node || node.t !== "d") return { value, matches: [] };
    const cands = Object.keys(node.children).filter((k) => k.startsWith(frag) && (frag[0] === "." || k[0] !== "."));
    if (cands.length === 1) {
      const full = dirPart + cands[0] + (node.children[cands[0]].t === "d" ? "/" : " ");
      parts[parts.length - 1] = full;
      return { value: parts.join(" "), matches: [] };
    }
    if (cands.length > 1) return { value, matches: cands };
    return { value, matches: [] };
  }, []);

  const cancelHeredoc = useCallback(() => {
    shellRef.current.heredoc = null;
  }, []);

  return useMemo(
    () => ({
      shell: shellRef.current,
      entries,
      version,
      promptPath,
      isHeredoc: () => !!shellRef.current.heredoc,
      submit,
      echoInput,
      pushLine,
      clearScreen,
      resetFs,
      runSetup,
      historyUp,
      historyDown,
      complete,
      cancelHeredoc,
    }),
    [entries, version, promptPath, submit, echoInput, pushLine, clearScreen, resetFs, runSetup, historyUp, historyDown, complete, cancelHeredoc]
  );
}

export type UseShellApi = ReturnType<typeof useShell>;
