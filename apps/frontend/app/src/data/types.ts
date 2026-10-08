import type { FileSystem } from "../engine/filesystem";

export interface LabCheckCtx {
  fs: FileSystem;
  ranScripts: Set<string>;
}

export interface LabCommand {
  cmd: string;
  note?: string;
}

export interface LabRef {
  label: string;
  url: string;
}

export interface LabExample {
  title: string;
  cmd: string;
  /** Static terminal output shown under the command. Empty string means the command prints nothing. */
  output: string;
  note?: string;
}

/** A sample line of output (or a command) with each part explained. */
export interface LabAnatomy {
  title: string;
  sample: string;
  /** Rows of [part, meaning]. */
  parts: string[][];
}

export interface LabMistake {
  symptom: string;
  cause: string;
  fix: string;
  /** Optional reproduction. When given, `output` must be what the sandbox really prints. */
  cmd?: string;
  output?: string;
}

export interface LabCompare {
  title: string;
  head: string[];
  rows: string[][];
}

export interface LabBodySection {
  h?: string;
  p?: string;
  /** One-line usage, e.g. `rm [OPTION]... FILE...` */
  syntax?: string;
  /** Rows of [flag, meaning]. */
  options?: string[][];
  examples?: LabExample[];
  whenToUse?: string[];
  whenNotToUse?: string[];
  /** Consequences callout, distinct from `aside`. */
  warning?: string;
  /** "How it works": paragraphs of HTML explaining what really happens. */
  how?: string[];
  anatomy?: LabAnatomy[];
  mistakes?: LabMistake[];
  compare?: LabCompare;
  cmds?: LabCommand[];
  table?: string[][];
  tree?: string;
  aside?: string;
  refs?: LabRef[];
}

export interface LabTask {
  text: string;
  /** Explanation shown for this task only: what each part means, what success looks like, common mistake. */
  hint: string;
  check: (ctx: LabCheckCtx) => boolean;
}

export interface Lab {
  id: number;
  title: string;
  sub: string;
  intro: string;
  body: LabBodySection[];
  tasks: LabTask[];
  solution: string[];
  tree?: string;
  brief?: string;
  setup?: (fs: FileSystem) => void;
}
