export interface DirNode {
  t: "d";
  mode: string;
  owner: string;
  group: string;
  children: Record<string, FSNode>;
}

export interface FileNode {
  t: "f";
  mode: string;
  owner: string;
  group: string;
  content: string;
}

export interface SymlinkNode {
  t: "l";
  mode: string;
  owner: string;
  group: string;
  target: string;
}

export type FSNode = DirNode | FileNode | SymlinkNode;

export interface CmdResult {
  out: string;
  err: string;
  code: number;
  pending?: boolean;
}
