import type { DirNode, FileNode, FSNode, SymlinkNode } from "./types";

export const HOME = "/home/labex";

export const D = (children?: Record<string, FSNode>, owner?: string, group?: string): DirNode => ({
  t: "d",
  mode: "755",
  owner: owner || "labex",
  group: group || "labex",
  children: children || {},
});
export const F = (content?: string, mode?: string, owner?: string, group?: string): FileNode => ({
  t: "f",
  mode: mode || "644",
  owner: owner || "labex",
  group: group || "labex",
  content: content || "",
});
export const L = (target: string, owner?: string, group?: string): SymlinkNode => ({
  t: "l",
  mode: "777",
  owner: owner || "labex",
  group: group || "labex",
  target,
});

export const PASSWD = `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd:/run/systemd:/usr/sbin/nologin
messagebus:x:101:104::/nonexistent:/usr/sbin/nologin
labex:x:1000:1000:LabEx User:/home/labex:/bin/bash
`;

export const USR_BIN = (
  "awk basename bash cat chmod chown cmp cp curl cut date df diff du echo env " +
  "file find grep groups gzip head hostname id less ln ls man mkdir mv nano passwd ping printf ps pwd " +
  "rm rmdir sed sort ssh stat sudo tail tar tee touch tr uniq useradd usermod wc wget which whoami xargs zip"
).split(" ");

const ETC_FILES = [
  "hostname", "hosts", "passwd", "group", "shadow", "fstab", "resolv.conf",
  "profile", "bash.bashrc", "crontab", "timezone", "os-release", "services", "shells", "sudoers",
];

export const TAR_MAGIC = "TARGZ:";

export function baseFS(): DirNode {
  const etc: Record<string, FSNode> = {};
  ETC_FILES.forEach((n, i) => {
    etc[n] = F(
      n === "passwd" ? PASSWD
      : n === "hostname" ? "sandbox\n"
      : n === "hosts" ? "127.0.0.1\tlocalhost\n127.0.1.1\tsandbox\n"
      : n === "os-release" ? 'NAME="Ubuntu"\nVERSION="22.04.3 LTS"\n'
      : "# " + n + " configuration\n" + "setting" + i + " = value\n",
      n === "shadow" || n === "sudoers" ? "640" : "644",
      "root",
      "root"
    );
  });
  etc["apt"] = D({ "sources.list": F("deb http://archive.ubuntu.com/ubuntu jammy main\n", "644", "root", "root") }, "root", "root");
  etc["ssh"] = D({ "ssh_config": F("Host *\n  SendEnv LANG\n", "644", "root", "root") }, "root", "root");

  const bin: Record<string, FSNode> = {};
  USR_BIN.forEach((n) => (bin[n] = F("#!/bin/sh\n# " + n + "\n", "755", "root", "root")));

  const rootHome = D({}, "root", "root");
  rootHome.mode = "700";

  return D({
    bin: L("/usr/bin", "root", "root"),
    etc: D(etc, "root", "root"),
    home: D({
      labex: D({
        Desktop: D({}),
        Documents: D({ "todo.md": F("- learn the terminal\n") }),
        Downloads: D({}),
        ".bashrc": F("# ~/.bashrc\nalias ll='ls -alF'\n"),
        ".profile": F("# ~/.profile\n"),
        "welcome.txt": F("Welcome to the sandbox. Work through the labs on the left.\n"),
      }),
    }),
    root: rootHome,
    tmp: D({}),
    usr: D({ bin: D(bin, "root", "root"), share: D({ doc: D({}) }, "root", "root"), local: D({ bin: D({}) }, "root", "root") }, "root", "root"),
    var: D({
      log: D({ "syslog": F("Sep 14 09:00:01 sandbox systemd[1]: Started Daily apt.\n", "644", "root", "root") }, "root", "root"),
      www: D({}, "root", "root"),
    }, "root", "root"),
  });
}

export function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i <= 0 ? "/" : p.slice(0, i);
}
export function basename(p: string): string {
  return p.split("/").filter(Boolean).pop() || "/";
}

export function deepCopy(node: FSNode): FSNode {
  if (node.t === "d") {
    const c: Record<string, FSNode> = {};
    for (const k in node.children) c[k] = deepCopy(node.children[k]);
    return { t: "d", mode: node.mode, owner: node.owner, group: node.group, children: c };
  }
  return { ...node };
}

export function sizeOf(node: FSNode): number {
  if (node.t === "d") {
    let s = 4096;
    for (const k in node.children) s += sizeOf(node.children[k]);
    return s;
  }
  if (node.t === "l") return 12;
  return node.content.length;
}

export function listTree(path: string, node: FSNode, out?: string[]): string[] {
  out = out || [];
  out.push(path);
  if (node.t === "d")
    for (const k of Object.keys(node.children).sort())
      listTree(path === "/" ? "/" + k : path + "/" + k, node.children[k], out);
  return out;
}

/** Owns one virtual filesystem + a current-working-directory cursor. */
export class FileSystem {
  root: DirNode;
  cwd: string;
  prevCwd: string;

  constructor() {
    this.root = baseFS();
    this.cwd = HOME;
    this.prevCwd = HOME;
  }

  reset() {
    this.root = baseFS();
    this.cwd = HOME;
    this.prevCwd = HOME;
  }

  resolve(p?: string | null, base?: string): string {
    base = base ?? this.cwd;
    if (p === undefined || p === null || p === "") return base;
    if (p === "~") p = HOME;
    else if (p.slice(0, 2) === "~/") p = HOME + p.slice(1);
    const raw = p[0] === "/" ? p : base + "/" + p;
    const out: string[] = [];
    for (const seg of raw.split("/")) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") {
        out.pop();
        continue;
      }
      out.push(seg);
    }
    return "/" + out.join("/");
  }

  getNode(path: string, follow = true, seen = 0): FSNode | null {
    if (seen > 12) return null;
    const parts = path.split("/").filter(Boolean);
    let node: FSNode | null = this.root;
    let cur = "";
    if (!node) return null;
    for (let i = 0; i < parts.length; i++) {
      if (!node) return null;
      if (node.t === "l") {
        node = this.getNode(this.resolve(node.target, dirname(cur)), true, seen + 1);
        if (!node) return null;
      }
      if (node.t !== "d") return null;
      node = node.children[parts[i]] ?? null;
      cur = cur + "/" + parts[i];
      if (!node) return null;
    }
    if (node && node.t === "l" && follow)
      return this.getNode(this.resolve(node.target, dirname(cur)), true, seen + 1);
    return node;
  }

  parentOf(path: string): FSNode | null {
    return this.getNode(dirname(path));
  }
  exists(path: string): boolean {
    return !!this.getNode(path, false);
  }
  isDir(path: string): boolean {
    const n = this.getNode(path);
    return !!n && n.t === "d";
  }
  isFile(path: string): boolean {
    const n = this.getNode(path);
    return !!n && n.t === "f";
  }

  writeFile(path: string, content: string, mode?: string): boolean {
    const par = this.parentOf(path);
    if (!par || par.t !== "d") return false;
    const name = basename(path);
    const ex = par.children[name];
    if (ex && ex.t === "d") return false;
    if (ex && ex.t === "f") ex.content = content;
    else par.children[name] = F(content, mode);
    return true;
  }
  readFile(path: string): string | null {
    const n = this.getNode(path);
    return n && n.t === "f" ? n.content : null;
  }
  mkdirp(path: string): boolean {
    const parts = path.split("/").filter(Boolean);
    let node: FSNode | null = this.root;
    let cur = "";
    for (const seg of parts) {
      cur += "/" + seg;
      if (!node || node.t !== "d") return false;
      if (!node.children[seg]) node.children[seg] = D({});
      node = node.children[seg];
      if (node.t === "l") node = this.getNode(node.target);
      if (!node || node.t !== "d") return false;
    }
    return true;
  }
  unlink(path: string): boolean {
    const par = this.parentOf(path);
    if (!par || par.t !== "d") return false;
    const n = basename(path);
    if (!par.children[n]) return false;
    delete par.children[n];
    return true;
  }
}
