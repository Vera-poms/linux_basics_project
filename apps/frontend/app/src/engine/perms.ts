import type { FSNode } from "./types";
import type { UserDB } from "./users";

export type Need = "r" | "w" | "x";

const BIT: Record<Need, number> = { r: 4, w: 2, x: 1 };

/** Does `username` have `need` access to `node`, given ownership + the mode string? `root` bypasses everything. */
export function allowed(node: FSNode, username: string, users: UserDB, need: Need, root: boolean): boolean {
  if (root) return true;
  const cls = node.owner === username ? 0 : users.groupsOf(username).includes(node.group) ? 1 : 2;
  const digit = Number(node.mode.padStart(3, "0")[cls]) || 0;
  return (digit & BIT[need]) !== 0;
}
