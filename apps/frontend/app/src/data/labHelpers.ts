import { HOME, PASSWD, TAR_MAGIC } from "../engine/filesystem";
import { lines } from "../engine/commands";
import type { Lab, LabCheckCtx } from "./types";

export const c = (cmd: string, note?: string) => ({ cmd, note });

export const has = (ctx: LabCheckCtx, p: string) => ctx.fs.exists(ctx.fs.resolve(p, HOME));
export const dir = (ctx: LabCheckCtx, p: string) => ctx.fs.isDir(ctx.fs.resolve(p, HOME));
export const read = (ctx: LabCheckCtx, p: string) => ctx.fs.readFile(ctx.fs.resolve(p, HOME));
export const mode = (ctx: LabCheckCtx, p: string) => {
  const n = ctx.fs.getNode(ctx.fs.resolve(p, HOME), false);
  return n ? n.mode : null;
};
export const link = (ctx: LabCheckCtx, p: string) => {
  const n = ctx.fs.getNode(ctx.fs.resolve(p, HOME), false);
  return !!n && n.t === "l";
};
export const nlines = (ctx: LabCheckCtx, p: string) => {
  const t = read(ctx, p);
  return t === null ? -1 : lines(t).length;
};
export const match = (ctx: LabCheckCtx, p: string, re: RegExp) => {
  const t = read(ctx, p);
  return t !== null && re.test(t);
};
export const isFile = (ctx: LabCheckCtx, p: string) => ctx.fs.isFile(ctx.fs.resolve(p, HOME));
export const tarMembers = (ctx: LabCheckCtx, p: string): string[] | null => {
  const t = read(ctx, p);
  if (t === null || t.slice(0, TAR_MAGIC.length) !== TAR_MAGIC) return null;
  const m = JSON.parse(t.slice(TAR_MAGIC.length));
  const out: string[] = [];
  for (const name in m) {
    (function walk(n: any, pth: string) {
      out.push(pth);
      if (n.t === "d") for (const k in n.children) walk(n.children[k], pth + "/" + k);
    })(m[name], name);
  }
  return out;
};
export const ranScript = (ctx: LabCheckCtx, p: string) => ctx.ranScripts.has(ctx.fs.resolve(p, HOME));

export const owner = (ctx: LabCheckCtx, p: string) => {
  const n = ctx.fs.getNode(ctx.fs.resolve(p, HOME), false);
  return n ? n.owner : null;
};
export const group = (ctx: LabCheckCtx, p: string) => {
  const n = ctx.fs.getNode(ctx.fs.resolve(p, HOME), false);
  return n ? n.group : null;
};

export interface PasswdEntry {
  uid: number;
  gid: number;
  home: string;
  shell: string;
}
export const passwdEntry = (ctx: LabCheckCtx, name: string): PasswdEntry | null => {
  const text = read(ctx, "/etc/passwd");
  if (text === null) return null;
  for (const l of lines(text)) {
    const [n, , uid, gid, , home, shell] = l.split(":");
    if (n === name) return { uid: parseInt(uid, 10), gid: parseInt(gid, 10), home, shell };
  }
  return null;
};

export interface GroupEntry {
  gid: number;
  members: string[];
}
export const groupEntry = (ctx: LabCheckCtx, name: string): GroupEntry | null => {
  const text = read(ctx, "/etc/group");
  if (text === null) return null;
  for (const l of lines(text)) {
    const [n, , gid, members] = l.split(":");
    if (n === name) return { gid: parseInt(gid, 10), members: members ? members.split(",").filter(Boolean) : [] };
  }
  return null;
};

export const inGroup = (ctx: LabCheckCtx, user: string, groupName: string): boolean => {
  const g = groupEntry(ctx, groupName);
  if (!g) return false;
  if (g.members.includes(user)) return true;
  const u = passwdEntry(ctx, user);
  return !!u && u.gid === g.gid;
};

export const shadowUnlocked = (ctx: LabCheckCtx, user: string): boolean => {
  const text = read(ctx, "/etc/shadow");
  if (text === null) return false;
  for (const l of lines(text)) {
    const [n, hash] = l.split(":");
    if (n === user) return hash !== "!" && hash !== "*";
  }
  return false;
};

export function taskState(lab: Lab, ctx: LabCheckCtx): boolean[] {
  return lab.tasks.map((t) => {
    try {
      return !!t.check(ctx);
    } catch {
      return false;
    }
  });
}

export { PASSWD, lines };
