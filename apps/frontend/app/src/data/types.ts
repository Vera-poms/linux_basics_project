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
  check: (ctx: LabCheckCtx) => boolean;
}

export interface Lab {
  id: number;
  title: string;
  sub: string;
  intro: string;
  body: LabBodySection[];
  tasks: LabTask[];
  hints: string[];
  solution: string[];
  tree?: string;
  brief?: string;
  setup?: (fs: FileSystem) => void;
}
