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

export interface LabBodySection {
  h?: string;
  p?: string;
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
