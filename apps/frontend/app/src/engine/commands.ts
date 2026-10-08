import type { CmdResult, FSNode } from "./types";
import { FileSystem, HOME, USR_BIN, TAR_MAGIC, basename, dirname, deepCopy, sizeOf, listTree } from "./filesystem";
import { globMatch } from "./shell";
import type { UserDB } from "./users";
import { allowed } from "./perms";

export type CommandFn = (args: string[], stdin?: string) => CmdResult;

export const OK = (out?: string): CmdResult => ({ out: out || "", err: "", code: 0 });
export const ERR = (msg: string, out?: string): CmdResult => ({
  out: out || "",
  err: msg.endsWith("\n") ? msg : msg + "\n",
  code: 1,
});
export const lines = (s: string): string[] => (s === "" ? [] : s.replace(/\n$/, "").split("\n"));

function flags(argv: string[], takesArg = "") {
  const f = new Set<string>();
  const rest: string[] = [];
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.length > 1 && a[0] === "-" && a !== "--" && !/^-\d/.test(a)) {
      if (a[1] === "-") {
        f.add(a.slice(2));
        continue;
      }
      const body = a.slice(1);
      for (let j = 0; j < body.length; j++) {
        const ch = body[j];
        f.add(ch);
        if (takesArg.includes(ch)) {
          if (j < body.length - 1) {
            opts[ch] = body.slice(j + 1);
            j = body.length;
          } else if (i + 1 < argv.length) {
            opts[ch] = argv[++i];
          }
        }
      }
      continue;
    }
    rest.push(a);
  }
  return { f, rest, opts };
}

function modeStr(node: FSNode): string {
  const m = node.mode.padStart(3, "0").split("").map(Number);
  const trip = (n: number) => ((n & 4) ? "r" : "-") + ((n & 2) ? "w" : "-") + ((n & 1) ? "x" : "-");
  return (node.t === "d" ? "d" : node.t === "l" ? "l" : "-") + trip(m[0]) + trip(m[1]) + trip(m[2]);
}
function human(n: number): string {
  if (n < 1024) return n + "";
  if (n < 1024 * 1024) return (n / 1024 < 10 ? (n / 1024).toFixed(1) : Math.round(n / 1024)) + "K";
  return (n / 1048576).toFixed(1) + "M";
}

export interface ShellSession {
  history: string[];
  lastCode: number;
  currentUser: string;
  sudoActive: boolean;
}

/** Builds the CMDS table bound to one filesystem/session instance. */
export function createCommands(fs: FileSystem, session: ShellSession, users: UserDB) {
  const CMDS: Record<string, CommandFn> = {};
  const isRoot = () => session.currentUser === "root" || session.sudoActive;
  const syncUserFiles = () => {
    fs.writeFile("/etc/passwd", users.renderPasswd());
    fs.writeFile("/etc/group", users.renderGroup());
    fs.writeFile("/etc/shadow", users.renderShadow());
  };

  CMDS.pwd = () => OK(fs.cwd + "\n");
  CMDS.whoami = () => OK((session.sudoActive ? "root" : session.currentUser) + "\n");
  CMDS.hostname = () => OK("sandbox\n");
  CMDS.date = () => OK("Mon Sep 14 09:41:12 UTC 2026\n");
  CMDS.clear = () => ({ out: "", err: "", code: 0, clear: true } as CmdResult & { clear: boolean });
  CMDS.which = (a) => {
    const out = a.map((n) => (USR_BIN.includes(n) ? "/usr/bin/" + n : null)).filter(Boolean);
    return out.length ? OK(out.join("\n") + "\n") : ERR("");
  };

  CMDS.cd = (a) => {
    const target = a[0] === "-" ? fs.prevCwd : fs.resolve(a[0] === undefined ? HOME : a[0]);
    const n = fs.getNode(target);
    if (!n) return ERR("bash: cd: " + (a[0] || "") + ": No such file or directory");
    if (n.t !== "d") return ERR("bash: cd: " + a[0] + ": Not a directory");
    if (!allowed(n, session.currentUser, users, "x", isRoot())) return ERR("bash: cd: " + a[0] + ": Permission denied");
    fs.prevCwd = fs.cwd;
    fs.cwd = target;
    return OK(a[0] === "-" ? target + "\n" : ""); // `cd -` prints where it took you, like bash
  };

  CMDS.ls = (a) => {
    const { f, rest } = flags(a);
    const paths = rest.length ? rest : ["."];
    const recursive = f.has("R") && !f.has("d");
    const showHidden = f.has("a") || f.has("A");
    const header = paths.length > 1 || recursive;
    type Entry = { name: string; node: FSNode };
    const bytesOf = (n: FSNode) => (n.t === "d" ? 4096 : sizeOf(n));
    const mark = (name: string, n: FSNode) => {
      if (!f.has("F")) return name;
      if (n.t === "d") return name + "/";
      if (n.t === "l") return name + "@";
      return n.mode.split("").some((d) => (Number(d) & 1) === 1) ? name + "*" : name;
    };
    const order = (es: Entry[]) => {
      const out = es.slice();
      if (f.has("S")) out.sort((x, y) => bytesOf(y.node) - bytesOf(x.node));
      return f.has("r") ? out.reverse() : out;
    };
    const render = (entries: Entry[], withTotal: boolean): string => {
      if (!f.has("l")) return entries.map((e) => mark(e.name, e.node)).join("\n") + (entries.length ? "\n" : "");
      const rows = entries.map((e) => {
        const bytes = bytesOf(e.node);
        const sz = f.has("h") ? human(bytes) : String(bytes);
        return [
          modeStr(e.node),
          e.node.t === "d" ? "2" : "1",
          e.node.owner,
          e.node.group,
          sz,
          "Sep 14 09:2" + (e.name.length % 9),
          mark(e.name, e.node) + (e.node.t === "l" ? " -> " + e.node.target : ""),
        ];
      });
      const w = [0, 0, 0, 0, 0].map((_, i) => Math.max(0, ...rows.map((r) => r[i].length)));
      return (
        (withTotal ? "total " + entries.length * 4 + "\n" : "") +
        rows
          .map(
            (r) =>
              r[0].padEnd(w[0]) + " " + r[1].padStart(w[1]) + " " + r[2].padEnd(w[2]) + " " +
              r[3].padEnd(w[3]) + " " + r[4].padStart(w[4]) + " " + r[5] + " " + r[6]
          )
          .join("\n") + (rows.length ? "\n" : "")
      );
    };

    let err = "";
    const fileEntries: Entry[] = [];
    const dirArgs: { label: string; abs: string; node: FSNode }[] = [];
    for (const p of paths) {
      const abs = fs.resolve(p);
      const node = fs.getNode(abs);
      if (!node) {
        err += "ls: cannot access '" + p + "': No such file or directory\n";
        continue;
      }
      if (node.t === "d" && !f.has("d")) dirArgs.push({ label: p, abs, node });
      else fileEntries.push({ name: p, node });
    }

    // ls sorts the names it was given, not just the contents of a folder.
    fileEntries.sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
    dirArgs.sort((x, y) => (x.label < y.label ? -1 : x.label > y.label ? 1 : 0));
    const sections: string[] = [];
    if (fileEntries.length) sections.push(render(order(fileEntries), false));
    const listDir = (label: string, abs: string, node: FSNode) => {
      if (node.t !== "d") return;
      let names = Object.keys(node.children).sort().filter((n) => showHidden || n[0] !== ".");
      if (f.has("a")) names = [".", ".."].concat(names);
      const entries: Entry[] = names.map((n) => ({
        name: n,
        node: n === "." ? node : n === ".." ? fs.getNode(dirname(abs)) || node : node.children[n],
      }));
      sections.push((header ? label + ":\n" : "") + render(order(entries), true));
      if (recursive)
        for (const n of names)
          if (n !== "." && n !== ".." && node.children[n].t === "d")
            listDir(label.replace(/\/$/, "") + "/" + n, abs === "/" ? "/" + n : abs + "/" + n, node.children[n]);
    };
    for (const d of dirArgs) listDir(d.label, d.abs, d.node);

    const res = OK(sections.join("\n"));
    res.err = err;
    if (err) res.code = 1;
    return res;
  };

  CMDS.tree = (a) => {
    const { f, rest, opts } = flags(a, "L");
    const root = fs.resolve(rest[0] || ".");
    const node = fs.getNode(root);
    if (!node) return ERR("tree: " + (rest[0] || ".") + ": No such file or directory");
    const maxLevel = opts.L !== undefined ? parseInt(opts.L, 10) : Infinity;
    if (!(maxLevel >= 1)) return ERR("tree: Invalid level, must be greater than 0.");
    let dirs = 0;
    let files = 0;
    let out = (rest[0] || ".") + "\n";
    (function walk(n: FSNode, prefix: string, level: number) {
      if (n.t !== "d" || level > maxLevel) return;
      const keys = Object.keys(n.children)
        .sort()
        .filter((k) => (f.has("a") || k[0] !== ".") && (!f.has("d") || n.children[k].t === "d"));
      keys.forEach((k, i) => {
        const last = i === keys.length - 1;
        const child = n.children[k];
        out += prefix + (last ? "└── " : "├── ") + k + (child.t === "l" ? " -> " + child.target : "") + "\n";
        if (child.t === "d") {
          dirs++;
          walk(child, prefix + (last ? "    " : "│   "), level + 1);
        } else files++;
      });
    })(node, "", 1);
    const dWord = dirs + (dirs === 1 ? " directory" : " directories");
    const fWord = files + (files === 1 ? " file" : " files");
    return OK(out + "\n" + dWord + (f.has("d") ? "" : ", " + fWord) + "\n");
  };

  CMDS.mkdir = (a) => {
    const { f, rest, opts } = flags(a, "m");
    const mode = opts.m !== undefined && /^[0-7]{3,4}$/.test(opts.m) ? opts.m.slice(-3) : null;
    if (opts.m !== undefined && mode === null) return ERR("mkdir: invalid mode '" + opts.m + "'");
    let out = "";
    let err = "";
    const made = (disp: string, abs: string, isLast: boolean) => {
      const n = fs.getNode(abs);
      if (n && mode && isLast) n.mode = mode;
      if (f.has("v")) out += "mkdir: created directory '" + disp + "'\n";
    };
    for (const p of rest) {
      const abs = fs.resolve(p);
      if (f.has("p")) {
        const segs = p.split("/").filter(Boolean);
        segs.forEach((_, i) => {
          const disp = (p.startsWith("/") ? "/" : "") + segs.slice(0, i + 1).join("/");
          const cur = fs.resolve(disp);
          if (fs.exists(cur)) return;
          fs.mkdirp(cur);
          made(disp, cur, i === segs.length - 1);
        });
        continue;
      }
      if (fs.exists(abs)) {
        err += "mkdir: cannot create directory '" + p + "': File exists\n";
        continue;
      }
      const par = fs.parentOf(abs);
      if (!par || par.t !== "d") {
        err += "mkdir: cannot create directory '" + p + "': No such file or directory\n";
        continue;
      }
      par.children[basename(abs)] = { t: "d", mode: mode || "755", owner: session.currentUser, group: session.currentUser, children: {} };
      made(p, abs, true);
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.rmdir = (a) => {
    const { f, rest } = flags(a);
    let out = "";
    let err = "";
    for (const p of rest) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs, false);
      if (!n) {
        err += "rmdir: failed to remove '" + p + "': No such file or directory\n";
        continue;
      }
      if (n.t !== "d") {
        err += "rmdir: failed to remove '" + p + "': Not a directory\n";
        continue;
      }
      if (Object.keys(n.children).length) {
        err += "rmdir: failed to remove '" + p + "': Directory not empty\n";
        continue;
      }
      if (f.has("v")) out += "rmdir: removing directory, '" + p + "'\n";
      fs.unlink(abs);
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.rm = (a) => {
    const { f, rest } = flags(a);
    const recursive = f.has("r") || f.has("R");
    let out = "";
    let err = "";
    const removeVerbose = (n: FSNode, disp: string) => {
      if (n.t === "d") {
        for (const k of Object.keys(n.children).sort()) removeVerbose(n.children[k], disp + "/" + k);
        out += "removed directory '" + disp + "'\n";
      } else out += "removed '" + disp + "'\n";
    };
    for (const p of rest) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs, false);
      if (!n) {
        if (!f.has("f")) err += "rm: cannot remove '" + p + "': No such file or directory\n";
        continue;
      }
      if (n.t === "d" && !recursive) {
        if (!f.has("d")) {
          err += "rm: cannot remove '" + p + "': Is a directory\n";
          continue;
        }
        if (Object.keys(n.children).length) {
          err += "rm: cannot remove '" + p + "': Directory not empty\n";
          continue;
        }
      }
      if (abs === "/" || abs === HOME) {
        err += "rm: refusing to remove '" + p + "'\n";
        continue;
      }
      if (f.has("i") && !f.has("f")) {
        // The sandbox cannot read a reply, so (like a closed stdin) it answers "no".
        const what = n.t === "d" ? "descend into directory" : n.t === "l" ? "remove symbolic link" : n.content === "" ? "remove regular empty file" : "remove regular file";
        err += "rm: " + what + " '" + p + "'? (answered no: the sandbox cannot read a reply)\n";
        continue;
      }
      if (f.has("v")) removeVerbose(n, p.replace(/\/$/, ""));
      fs.unlink(abs);
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.touch = (a) => {
    let err = "";
    for (const p of a) {
      const abs = fs.resolve(p);
      if (fs.exists(abs)) continue;
      const par = fs.parentOf(abs);
      if (!par || par.t !== "d") {
        err += "touch: cannot touch '" + p + "': No such file or directory\n";
        continue;
      }
      par.children[basename(abs)] = { t: "f", mode: "644", owner: session.currentUser, group: session.currentUser, content: "" };
    }
    return err ? { out: "", err, code: 1 } : OK();
  };

  CMDS.echo = (a) => {
    const noNL = a[0] === "-n";
    if (noNL) a = a.slice(1);
    let s = a.join(" ");
    if (a[0] === "-e") {
      s = a
        .slice(1)
        .join(" ")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");
    }
    return OK(s + (noNL ? "" : "\n"));
  };

  CMDS.printf = (a) => {
    let fmt = a[0] || "";
    const args = a.slice(1);
    let i = 0;
    fmt = fmt.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    return OK(fmt.replace(/%[sd]/g, () => (args[i++] !== undefined ? args[i - 1] : "")));
  };

  CMDS.cat = (a, stdin) => {
    const { f, rest } = flags(a);
    let out = "";
    let err = "";
    if (!rest.length) out = stdin || "";
    for (const p of rest) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs);
      if (!n) {
        err += "cat: " + p + ": No such file or directory\n";
        continue;
      }
      if (n.t === "d") {
        err += "cat: " + p + ": Is a directory\n";
        continue;
      }
      if (!allowed(n, session.currentUser, users, "r", isRoot())) {
        err += "cat: " + p + ": Permission denied\n";
        continue;
      }
      if (n.t === "f") out += n.content;
    }
    if (f.has("n")) out = lines(out).map((l, i) => String(i + 1).padStart(6) + "\t" + l).join("\n") + "\n";
    return { out, err, code: err ? 1 : 0 };
  };
  CMDS.less = CMDS.cat;
  CMDS.more = CMDS.cat;

  const readable = (cmd: string, path: string): { content?: string; err?: string } => {
    const abs = fs.resolve(path);
    const n = fs.getNode(abs);
    if (!n) return { err: cmd + ": cannot open '" + path + "' for reading: No such file or directory" };
    if (n.t !== "f") return { err: cmd + ": " + path + ": Is a directory" };
    if (!allowed(n, session.currentUser, users, "r", isRoot())) return { err: cmd + ": " + path + ": Permission denied" };
    return { content: n.content };
  };

  const headTail = (kind: "head" | "tail"): CommandFn => (a, stdin) => {
    // `head -3` is shorthand for `head -n 3`.
    const norm: string[] = [];
    for (const x of a) norm.push(...(/^-\d+$/.test(x) ? ["-n", x.slice(1)] : [x]));
    const { rest, opts } = flags(norm, "nc");
    const byBytes = opts.c !== undefined;
    const spec = byBytes ? opts.c : opts.n !== undefined ? opts.n : "10";
    const fromStart = kind === "tail" && spec.startsWith("+");
    const dropLast = kind === "head" && spec.startsWith("-");
    const count = parseInt(spec.replace(/^[+-]/, ""), 10);
    if (Number.isNaN(count)) return ERR(kind + ": invalid number of " + (byBytes ? "bytes" : "lines") + ": '" + spec + "'");
    const pick = <T,>(all: T[]): T[] =>
      kind === "head"
        ? dropLast ? all.slice(0, Math.max(0, all.length - count)) : all.slice(0, count)
        : fromStart ? all.slice(Math.max(0, count - 1)) : count === 0 ? [] : all.slice(-count);
    const apply = (s: string): string => {
      if (byBytes) return pick(s.split("")).join("");
      const sel = pick(lines(s));
      return sel.length ? sel.join("\n") + "\n" : "";
    };
    if (!rest.length) return OK(apply(stdin ?? ""));
    let out = "";
    let err = "";
    rest.forEach((p) => {
      const r = readable(kind, p);
      if (r.err) {
        err += r.err + "\n";
        return;
      }
      if (rest.length > 1) out += (out ? "\n" : "") + "==> " + p + " <==\n";
      out += apply(r.content!);
    });
    return { out, err, code: err ? 1 : 0 };
  };
  CMDS.head = headTail("head");
  CMDS.tail = headTail("tail");

  CMDS.wc = (a, stdin) => {
    const { f, rest } = flags(a);
    const only = f.has("l") || f.has("w") || f.has("c");
    const count = (s: string) => ({
      l: (s.match(/\n/g) || []).length, // wc counts newline characters, so an unterminated last line is not counted
      w: s.split(/\s+/).filter(Boolean).length,
      c: s.length,
    });
    const fmt = (n: { l: number; w: number; c: number }, name: string) => {
      const parts: number[] = [];
      if (f.has("l") || !only) parts.push(n.l);
      if (f.has("w") || !only) parts.push(n.w);
      if (f.has("c") || !only) parts.push(n.c);
      return parts.map((p) => String(p).padStart(only && parts.length === 1 ? 0 : 7)).join(" ") + (name ? " " + name : "");
    };
    if (!rest.length) return OK(fmt(count(stdin ?? ""), "") + "\n");
    let out = "";
    let err = "";
    const total = { l: 0, w: 0, c: 0 };
    let ok = 0;
    for (const p of rest) {
      const c = fs.readFile(fs.resolve(p));
      if (c === null) {
        err += "wc: " + p + ": No such file or directory\n";
        continue;
      }
      const n = count(c);
      total.l += n.l;
      total.w += n.w;
      total.c += n.c;
      ok++;
      out += fmt(n, p) + "\n";
    }
    if (rest.length > 1 && ok > 0) out += fmt(total, "total") + "\n";
    return { out, err, code: err ? 1 : 0 };
  };

  /** A copy belongs to whoever made it (like real cp) unless -p asks to keep the original owner. */
  const reown = (n: FSNode): FSNode => {
    n.owner = session.currentUser;
    n.group = session.currentUser;
    if (n.t === "d") for (const k in n.children) reown(n.children[k]);
    return n;
  };
  /** One line per file the way `-v` prints a recursive copy. */
  const walkNames = (n: FSNode, sDisp: string, dDisp: string, emit: (s: string, d: string) => void) => {
    emit(sDisp, dDisp);
    if (n.t === "d") for (const k of Object.keys(n.children).sort()) walkNames(n.children[k], sDisp + "/" + k, dDisp + "/" + k, emit);
  };

  CMDS.cp = (a) => {
    const { f, rest } = flags(a);
    if (rest.length < 2) return ERR("cp: missing destination file operand");
    const dst = rest.pop()!;
    const recursive = f.has("r") || f.has("R") || f.has("a");
    const preserve = f.has("p") || f.has("a");
    let out = "";
    let err = "";
    for (const src of rest) {
      const sAbs = fs.resolve(src);
      const sNode = fs.getNode(sAbs, false);
      if (!sNode) {
        err += "cp: cannot stat '" + src + "': No such file or directory\n";
        continue;
      }
      if (sNode.t === "d" && !recursive) {
        err += "cp: -r not specified; omitting directory '" + src + "'\n";
        continue;
      }
      // `cp -r dir/. dest` copies what is inside dir, not dir itself.
      const contentsOnly = sNode.t === "d" && /(^|\/)\.$/.test(src);
      let dAbs = fs.resolve(dst);
      let dDisp = dst;
      if (!contentsOnly && fs.isDir(dAbs)) {
        dAbs = dAbs + "/" + basename(sAbs);
        dDisp = dst.replace(/\/$/, "") + "/" + basename(sAbs);
      }
      const place = (node: FSNode, abs: string, sDisp: string, disp: string) => {
        const par = fs.parentOf(abs);
        if (!par || par.t !== "d") {
          err += "cp: cannot create '" + disp + "': No such file or directory\n";
          return;
        }
        const existing = par.children[basename(abs)];
        if (existing && node.t === "d" && existing.t === "d") {
          // Copying a folder onto a folder of the same name merges into it.
          for (const k of Object.keys(node.children).sort()) place(node.children[k], abs + "/" + k, sDisp + "/" + k, disp + "/" + k);
          return;
        }
        if (existing) {
          if (f.has("n")) return;
          if (f.has("i")) {
            // The sandbox cannot read a reply, so (like a closed stdin) it answers "no".
            err += "cp: overwrite '" + disp + "'? (answered no: the sandbox cannot read a reply)\n";
            return;
          }
        }
        const copy = deepCopy(node);
        par.children[basename(abs)] = preserve ? copy : reown(copy);
        if (f.has("v")) walkNames(node, sDisp, disp, (s, d) => (out += "'" + s + "' -> '" + d + "'\n"));
      };
      if (contentsOnly) {
        if (!fs.exists(dAbs)) fs.mkdirp(dAbs);
        for (const k of Object.keys((sNode as { children: Record<string, FSNode> }).children).sort())
          place((sNode as { children: Record<string, FSNode> }).children[k], dAbs + "/" + k, src.replace(/\/?\.$/, "") + "/" + k, dDisp.replace(/\/$/, "") + "/" + k);
      } else place(sNode, dAbs, src, dDisp);
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.mv = (a) => {
    const { f, rest } = flags(a);
    if (rest.length < 2) return ERR("mv: missing destination file operand");
    const dst = rest.pop()!;
    let out = "";
    let err = "";
    for (const src of rest) {
      const sAbs = fs.resolve(src);
      const sNode = fs.getNode(sAbs, false);
      if (!sNode) {
        err += "mv: cannot stat '" + src + "': No such file or directory\n";
        continue;
      }
      let dAbs = fs.resolve(dst);
      let dDisp = dst;
      if (fs.isDir(dAbs)) {
        dAbs = dAbs + "/" + basename(sAbs);
        dDisp = dst.replace(/\/$/, "") + "/" + basename(sAbs);
      }
      const par = fs.parentOf(dAbs);
      if (!par || par.t !== "d") {
        err += "mv: cannot move '" + src + "' to '" + dst + "': No such file or directory\n";
        continue;
      }
      if (dAbs === sAbs) {
        err += "mv: '" + src + "' and '" + dDisp + "' are the same file\n";
        continue;
      }
      if (par.children[basename(dAbs)]) {
        if (f.has("n")) continue;
        if (f.has("i") && !f.has("f")) {
          // The sandbox cannot read a reply, so (like a closed stdin) it answers "no".
          err += "mv: overwrite '" + dDisp + "'? (answered no: the sandbox cannot read a reply)\n";
          continue;
        }
      }
      par.children[basename(dAbs)] = sNode;
      fs.unlink(sAbs);
      if (f.has("v")) out += "renamed '" + src + "' -> '" + dDisp + "'\n";
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.find = (a) => {
    const roots: string[] = [];
    const pred: { name?: string; type?: string; depth?: number; del?: boolean } = {};
    for (let i = 0; i < a.length; i++) {
      if (a[i] === "-name") pred.name = a[++i];
      else if (a[i] === "-type") pred.type = a[++i];
      else if (a[i] === "-maxdepth") pred.depth = parseInt(a[++i], 10);
      else if (a[i] === "-delete") pred.del = true;
      else if (a[i][0] !== "-") roots.push(a[i]);
    }
    if (!roots.length) roots.push(".");
    let out = "";
    let err = "";
    const toDelete: string[] = [];
    for (const r of roots) {
      const abs = fs.resolve(r);
      const node = fs.getNode(abs, false);
      if (!node) {
        err += "find: '" + r + "': No such file or directory\n";
        continue;
      }
      (function walk(n: FSNode, display: string, absPath: string, depth: number) {
        let match = true;
        if (pred.name && !globMatch(pred.name, basename(absPath) === "/" ? display : basename(display))) match = false;
        if (pred.type === "f" && n.t !== "f") match = false;
        if (pred.type === "d" && n.t !== "d") match = false;
        if (pred.depth !== undefined && depth > pred.depth) return;
        if (match) {
          out += display + "\n";
          if (pred.del) toDelete.push(absPath);
        }
        if (n.t === "d")
          for (const k of Object.keys(n.children).sort())
            walk(n.children[k], display + "/" + k, absPath + "/" + k, depth + 1);
      })(node, r.replace(/\/$/, ""), abs, 0);
    }
    toDelete.forEach((p) => fs.unlink(p));
    if (pred.del) out = "";
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.grep = (a, stdin) => {
    const { f, rest } = flags(a);
    const pat = rest.shift();
    if (pat === undefined) return ERR("usage: grep [OPTION]... PATTERN [FILE]...");
    let re: RegExp;
    try {
      re = new RegExp(pat, f.has("i") ? "i" : "");
    } catch {
      return ERR("grep: invalid pattern");
    }
    const targets: { name: string | null; missing?: boolean; isdir?: boolean; content?: string }[] = [];
    if (rest.length) {
      for (const p of rest) {
        const abs = fs.resolve(p);
        const n = fs.getNode(abs);
        if (!n) {
          targets.push({ name: p, missing: true });
          continue;
        }
        if (n.t === "d") {
          if (f.has("r") || f.has("R")) {
            for (const full of listTree(abs, n)) {
              const fn = fs.getNode(full);
              if (fn && fn.t === "f")
                targets.push({ name: p.replace(/\/$/, "") + full.slice(abs.length), content: fn.content });
            }
          } else targets.push({ name: p, isdir: true });
          continue;
        }
        targets.push({ name: p, content: n.t === "f" ? n.content : "" });
      }
    } else targets.push({ name: null, content: stdin ?? "" });

    let out = "";
    let err = "";
    let count = 0;
    const showName = targets.filter((t) => t.name).length > 1;
    for (const t of targets) {
      if (t.missing) {
        err += "grep: " + t.name + ": No such file or directory\n";
        continue;
      }
      if (t.isdir) {
        err += "grep: " + t.name + ": Is a directory\n";
        continue;
      }
      const ls = lines(t.content ?? "");
      let fileCount = 0;
      ls.forEach((l, i) => {
        const hit = re.test(l);
        if (f.has("v") ? !hit : hit) {
          count++;
          fileCount++;
          if (f.has("c") || f.has("q")) return;
          let prefix = "";
          if (showName && t.name) prefix += t.name + ":";
          if (f.has("n")) prefix += i + 1 + ":";
          out += prefix + l + "\n";
        }
      });
      if (f.has("c")) out += (showName && t.name ? t.name + ":" : "") + fileCount + "\n";
    }
    if (f.has("q")) out = "";
    return { out, err, code: count ? 0 : 1 };
  };

  CMDS.sort = (a, stdin) => {
    const { f, rest, opts } = flags(a, "k");
    const src = rest.length ? fs.readFile(fs.resolve(rest[0])) : stdin ?? "";
    if (src === null) return ERR("sort: cannot read: " + rest[0]);
    let L2 = lines(src);
    const keyN = opts.k ? parseInt(opts.k, 10) : null;
    const val = (s: string) => (keyN ? s.trim().split(/\s+/)[keyN - 1] || "" : s);
    L2.sort((x, y) => {
      const a1 = val(x);
      const b1 = val(y);
      if (f.has("n")) return (parseFloat(a1) || 0) - (parseFloat(b1) || 0);
      return a1 < b1 ? -1 : a1 > b1 ? 1 : 0;
    });
    if (f.has("r")) L2.reverse();
    if (f.has("u")) L2 = L2.filter((v, i) => i === 0 || v !== L2[i - 1]);
    return OK(L2.length ? L2.join("\n") + "\n" : "");
  };

  CMDS.uniq = (a, stdin) => {
    const { f, rest } = flags(a);
    const src = rest.length ? fs.readFile(fs.resolve(rest[0])) : stdin ?? "";
    if (src === null) return ERR("uniq: cannot read");
    const L2 = lines(src);
    const out: string[] = [];
    let prev: string | null = null;
    let n = 0;
    for (const l of L2) {
      if (l === prev) n++;
      else {
        if (prev !== null) out.push(f.has("c") ? String(n).padStart(7) + " " + prev : prev);
        prev = l;
        n = 1;
      }
    }
    if (prev !== null) out.push(f.has("c") ? String(n).padStart(7) + " " + prev : prev);
    return OK(out.length ? out.join("\n") + "\n" : "");
  };

  CMDS.cut = (a, stdin) => {
    let delim = "\t";
    let fieldSpec: string | null = null;
    const files: string[] = [];
    for (let i = 0; i < a.length; i++) {
      const t = a[i];
      if (t.startsWith("-d")) delim = t.length > 2 ? t.slice(2) : a[++i];
      else if (t.startsWith("-f")) fieldSpec = t.length > 2 ? t.slice(2) : a[++i];
      else if (t[0] !== "-") files.push(t);
    }
    const src = files.length ? fs.readFile(fs.resolve(files[0])) : stdin ?? "";
    if (src === null) return ERR("cut: " + files[0] + ": No such file or directory");
    const idx = (fieldSpec || "1").split(",").map((s) => parseInt(s, 10));
    const out = lines(src).map((l) => idx.map((i) => l.split(delim)[i - 1] || "").join(delim)).join("\n");
    return OK(out ? out + "\n" : "");
  };

  CMDS.awk = (a, stdin) => {
    const prog = a.find((x) => x.includes("{")) || "";
    const files = a.filter((x) => x !== prog && x[0] !== "-");
    const src = files.length ? fs.readFile(fs.resolve(files[0])) : stdin ?? "";
    if (src === null) return ERR("awk: cannot open " + files[0]);
    const m = prog.match(/\{\s*print\s+(.+?)\s*\}/);
    if (!m) return OK(src);
    const fields = m[1].split(",").map((s) => s.trim());
    const out = lines(src)
      .map((l) => {
        const F2 = l.trim().split(/\s+/);
        return fields
          .map((f2) => {
            const fm = f2.match(/^\$(\d+)$/);
            if (fm) return fm[1] === "0" ? l : F2[parseInt(fm[1], 10) - 1] || "";
            return f2.replace(/^["']|["']$/g, "");
          })
          .join(" ");
      })
      .join("\n");
    return OK(out ? out + "\n" : "");
  };

  CMDS.tee = (a, stdin) => {
    const { f, rest } = flags(a);
    for (const p of rest) {
      const abs = fs.resolve(p);
      const prev = f.has("a") ? fs.readFile(abs) || "" : "";
      fs.writeFile(abs, prev + (stdin ?? ""));
    }
    return OK(stdin ?? "");
  };

  CMDS.chmod = (a) => {
    const { f, rest } = flags(a);
    const spec = rest.shift();
    if (!spec || !rest.length) return ERR("chmod: missing operand");
    let err = "";
    const apply = (node: FSNode) => {
      if (/^[0-7]{3,4}$/.test(spec)) {
        node.mode = spec.slice(-3);
        return;
      }
      const m = spec.match(/^([ugoa]*)([+-=])([rwxX]+)$/);
      if (!m) {
        err += "chmod: invalid mode: '" + spec + "'\n";
        return;
      }
      const who = m[1] || "a";
      const op = m[2];
      const bits = m[3];
      const val = (bits.includes("r") ? 4 : 0) + (bits.includes("w") ? 2 : 0) + (bits.includes("x") || bits.includes("X") ? 1 : 0);
      const cur = node.mode.padStart(3, "0").split("").map(Number);
      const targets = who === "a" ? [0, 1, 2] : who.split("").map((c) => ({ u: 0, g: 1, o: 2 } as Record<string, number>)[c]);
      for (const t of targets) {
        if (op === "+") cur[t] |= val;
        else if (op === "-") cur[t] &= ~val;
        else cur[t] = val;
      }
      node.mode = cur.join("");
    };
    for (const p of rest) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs, false);
      if (!n) {
        err += "chmod: cannot access '" + p + "': No such file or directory\n";
        continue;
      }
      if (n.owner !== session.currentUser && !isRoot()) {
        err += "chmod: changing permissions of '" + p + "': Operation not permitted\n";
        continue;
      }
      if (f.has("R") || f.has("r"))
        listTree(abs, n).forEach((fp) => {
          const x = fs.getNode(fp, false);
          if (x) apply(x);
        });
      else apply(n);
    }
    return err ? { out: "", err, code: 1 } : OK();
  };

  CMDS.chown = (a) => {
    const { f, rest } = flags(a);
    if (rest.length < 2) return ERR("chown: missing operand");
    const spec = rest.shift()!;
    const [ownerName, groupName] = spec.split(":");
    if (!isRoot()) return ERR("chown: changing ownership of '" + rest[0] + "': Operation not permitted");
    if (ownerName && !users.users[ownerName]) return ERR("chown: invalid user: '" + spec + "'");
    if (groupName && !users.groups[groupName]) return ERR("chown: invalid group: '" + spec + "'");
    let err = "";
    const apply = (node: FSNode) => {
      if (ownerName) node.owner = ownerName;
      if (groupName) node.group = groupName;
    };
    for (const p of rest) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs, false);
      if (!n) {
        err += "chown: cannot access '" + p + "': No such file or directory\n";
        continue;
      }
      if (f.has("R") || f.has("r"))
        listTree(abs, n).forEach((fp) => {
          const x = fs.getNode(fp, false);
          if (x) apply(x);
        });
      else apply(n);
    }
    return err ? { out: "", err, code: 1 } : OK();
  };

  CMDS.id = (a) => {
    const name = a[0] || session.currentUser;
    const u = users.users[name];
    if (!u) return ERR("id: '" + name + "': no such user");
    const gnames = users.groupsOf(name);
    const gid = u.gid;
    const primary = users.groups[gnames[0]];
    const groupsStr = gnames.map((g) => users.groups[g].gid + "(" + g + ")").join(",");
    return OK(
      "uid=" + u.uid + "(" + u.name + ") gid=" + gid + "(" + (primary ? primary.name : gnames[0]) + ") groups=" + groupsStr + "\n"
    );
  };

  CMDS.groups = (a) => {
    const name = a[0] || session.currentUser;
    if (!users.users[name]) return ERR("groups: '" + name + "': no such user");
    return OK(users.groupsOf(name).join(" ") + "\n");
  };

  CMDS.diff = (a) => {
    const { rest } = flags(a);
    if (rest.length < 2) return ERR("diff: missing operand");
    const [p1, p2] = rest;
    const a1 = fs.getNode(fs.resolve(p1));
    const a2 = fs.getNode(fs.resolve(p2));
    if (!a1) return ERR("diff: " + p1 + ": No such file or directory");
    if (!a2) return ERR("diff: " + p2 + ": No such file or directory");
    if (a1.t !== "f" || a2.t !== "f") return ERR("diff: cannot compare directories");
    if (!allowed(a1, session.currentUser, users, "r", isRoot())) return ERR("diff: " + p1 + ": Permission denied");
    if (!allowed(a2, session.currentUser, users, "r", isRoot())) return ERR("diff: " + p2 + ": Permission denied");
    const L1 = lines(a1.content);
    const L2 = lines(a2.content);
    if (L1.length === L2.length && L1.every((l, i) => l === L2[i])) return OK("");

    // Longest common subsequence table, walked forward into an edit script.
    const n = L1.length, m = L2.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--) dp[i][j] = L1[i] === L2[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

    type Op = { k: "eq" | "del" | "ins"; i: number; j: number };
    const ops: Op[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (L1[i] === L2[j]) {
        ops.push({ k: "eq", i, j });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        ops.push({ k: "del", i, j });
        i++;
      } else {
        ops.push({ k: "ins", i, j });
        j++;
      }
    }
    while (i < n) ops.push({ k: "del", i: i++, j });
    while (j < m) ops.push({ k: "ins", i, j: j++ });

    let out = "";
    let p = 0;
    while (p < ops.length) {
      if (ops[p].k === "eq") {
        p++;
        continue;
      }
      const start = p;
      while (p < ops.length && ops[p].k !== "eq") p++;
      const dels = ops.slice(start, p).filter((o) => o.k === "del");
      const inss = ops.slice(start, p).filter((o) => o.k === "ins");
      const op = dels.length && inss.length ? "c" : dels.length ? "d" : "a";
      const delRange = dels.length === 0 ? String(ops[start].i) : dels.length === 1 ? String(dels[0].i + 1) : dels[0].i + 1 + "," + (dels[dels.length - 1].i + 1);
      const insRange = inss.length === 0 ? String(ops[start].j) : inss.length === 1 ? String(inss[0].j + 1) : inss[0].j + 1 + "," + (inss[inss.length - 1].j + 1);
      out += delRange + op + insRange + "\n";
      for (const d of dels) out += "< " + L1[d.i] + "\n";
      if (op === "c") out += "---\n";
      for (const ins of inss) out += "> " + L2[ins.j] + "\n";
    }
    return { out, err: "", code: 1 };
  };

  CMDS.cmp = (a) => {
    const { rest } = flags(a);
    if (rest.length < 2) return ERR("cmp: missing operand");
    const [p1, p2] = rest;
    const r1 = readable("cmp", p1);
    const r2 = readable("cmp", p2);
    if (r1.err) return ERR(r1.err);
    if (r2.err) return ERR(r2.err);
    const c1 = r1.content!, c2 = r2.content!;
    if (c1 === c2) return OK("");
    let i = 0;
    while (i < c1.length && i < c2.length && c1[i] === c2[i]) i++;
    if (i >= c1.length || i >= c2.length)
      return { out: "", err: "cmp: EOF on " + (c1.length < c2.length ? p1 : p2) + "\n", code: 1 };
    const lineNo = c1.slice(0, i).split("\n").length;
    return { out: "", err: "cmp: " + p1 + " " + p2 + " differ: byte " + (i + 1) + ", line " + lineNo + "\n", code: 1 };
  };

  CMDS.useradd = (a) => {
    const { f, rest, opts } = flags(a, "sG");
    const name = rest[0];
    if (!name) return ERR("useradd: missing operand");
    if (!isRoot()) return ERR("useradd: Permission denied.");
    const groups = opts.G ? opts.G.split(",") : [];
    const shell = opts.s;
    const home = "/home/" + name;
    const res = users.addUser(name, { shell, groups, home });
    if (!res.ok) return ERR(res.err!);
    if (f.has("m")) {
      fs.mkdirp(home);
      const n = fs.getNode(home, false);
      if (n) {
        n.owner = name;
        n.group = name;
        n.mode = "700";
      }
    }
    syncUserFiles();
    return OK();
  };

  CMDS.usermod = (a) => {
    const { rest, opts, f } = flags(a, "sgG");
    const name = rest[0];
    if (!name) return ERR("usermod: missing operand");
    if (!isRoot()) return ERR("usermod: Permission denied.");
    if (!users.users[name]) return ERR("usermod: user '" + name + "' does not exist");
    let err = "";
    if (opts.s) users.setShell(name, opts.s);
    if (opts.g) {
      const r = users.setPrimaryGroup(name, opts.g);
      if (!r.ok) err += r.err + "\n";
    }
    if (opts.G && f.has("a")) {
      for (const g of opts.G.split(",")) {
        const r = users.addToGroup(name, g);
        if (!r.ok) err += r.err + "\n";
      }
    }
    syncUserFiles();
    return err ? { out: "", err, code: 1 } : OK();
  };

  CMDS.passwd = (a) => {
    const name = a[0] || session.currentUser;
    if (name !== session.currentUser && !isRoot()) return ERR("passwd: Permission denied.");
    const res = users.setPassword(name);
    if (!res.ok) return ERR(res.err!);
    syncUserFiles();
    return OK("passwd: password updated successfully\n");
  };

  CMDS.ln = (a) => {
    const { f, rest } = flags(a);
    if (rest.length < 1) return ERR("ln: missing file operand");
    const target = rest[0];
    let linkPath = rest[1] !== undefined ? fs.resolve(rest[1]) : fs.resolve(basename(target));
    if (fs.isDir(linkPath)) linkPath = linkPath + "/" + basename(target);
    const par = fs.parentOf(linkPath);
    if (!par || par.t !== "d") return ERR("ln: failed to create link '" + rest[1] + "': No such file or directory");
    if (fs.exists(linkPath)) return ERR("ln: failed to create symbolic link '" + rest[1] + "': File exists");
    if (f.has("s")) par.children[basename(linkPath)] = { t: "l", mode: "777", owner: session.currentUser, group: session.currentUser, target };
    else {
      const src = fs.getNode(fs.resolve(target));
      if (!src) return ERR("ln: failed to access '" + target + "': No such file or directory");
      if (src.t === "d") return ERR("ln: " + target + ": hard link not allowed for directory");
      par.children[basename(linkPath)] = src;
    }
    return OK();
  };

  CMDS.readlink = (a) => {
    const { rest } = flags(a);
    const n = fs.getNode(fs.resolve(rest[0] || ""), false);
    if (!n) return ERR("readlink: " + rest[0] + ": No such file or directory");
    return n.t === "l" ? OK(fs.resolve(n.target, dirname(fs.resolve(rest[0]))) + "\n") : ERR("");
  };

  CMDS.du = (a) => {
    const { f, rest } = flags(a);
    const paths = rest.length ? rest : ["."];
    let out = "";
    let err = "";
    for (const p of paths) {
      const abs = fs.resolve(p);
      const n = fs.getNode(abs);
      if (!n) {
        err += "du: cannot access '" + p + "': No such file or directory\n";
        continue;
      }
      const emit = (node: FSNode, display: string) => {
        const bytes = sizeOf(node);
        const size = f.has("h") ? human(bytes) : String(Math.max(4, Math.round(bytes / 1024)));
        out += size + "\t" + display + "\n";
      };
      if (f.has("s")) emit(n, p.replace(/\/$/, ""));
      else {
        if (n.t === "d")
          for (const full of listTree(abs, n)) {
            const node = fs.getNode(full);
            if (node && node.t === "d") emit(node, p.replace(/\/$/, "") + full.slice(abs.length));
          }
        else emit(n, p);
      }
    }
    return { out, err, code: err ? 1 : 0 };
  };

  CMDS.df = () =>
    OK(
      "Filesystem      Size  Used Avail Use% Mounted on\n" +
        "overlay          40G   12G   26G  32% /\n" +
        "tmpfs           1.9G     0  1.9G   0% /dev/shm\n"
    );

  CMDS.tar = (a) => {
    const { f, rest, opts } = flags(a, "fC");
    const fileArg = opts.f || (f.has("f") ? rest.shift() : null);
    const changeDir = opts.C || null;
    if (f.has("c")) {
      if (!fileArg) return ERR("tar: no archive name given");
      const members: Record<string, FSNode> = {};
      for (const src of rest) {
        const abs = fs.resolve(src);
        const node = fs.getNode(abs, false);
        if (!node) return ERR("tar: " + src + ": Cannot stat: No such file or directory");
        members[src.replace(/\/$/, "")] = deepCopy(node);
      }
      if (!Object.keys(members).length) return ERR("tar: Cowardly refusing to create an empty archive");
      fs.writeFile(fs.resolve(fileArg), TAR_MAGIC + JSON.stringify(members));
      return OK();
    }
    const raw = fs.readFile(fs.resolve(fileArg || ""));
    if (raw === null) return ERR("tar: " + fileArg + ": Cannot open: No such file or directory");
    if (raw.slice(0, TAR_MAGIC.length) !== TAR_MAGIC) return ERR("tar: This does not look like a tar archive");
    const members: Record<string, FSNode> = JSON.parse(raw.slice(TAR_MAGIC.length));
    if (f.has("t")) {
      let out = "";
      for (const name in members) {
        const walk = (n: FSNode, p: string) => {
          out += p + (n.t === "d" ? "/" : "") + "\n";
          if (n.t === "d") for (const k of Object.keys(n.children).sort()) walk(n.children[k], p + "/" + k);
        };
        walk(members[name], name);
      }
      return OK(out);
    }
    if (f.has("x")) {
      const base = changeDir ? fs.resolve(changeDir) : fs.cwd;
      if (!fs.isDir(base)) return ERR("tar: " + changeDir + ": Cannot chdir: No such file or directory");
      for (const name in members) {
        const dest = fs.resolve(name, base);
        fs.mkdirp(dirname(dest));
        const par = fs.parentOf(dest);
        if (par && par.t === "d") par.children[basename(dest)] = deepCopy(members[name]);
      }
      return OK();
    }
    return ERR("tar: You must specify one of the '-ctx' options");
  };
  CMDS.gzip = (a) => {
    const p = fs.resolve(flags(a).rest[0] || "");
    const c = fs.readFile(p);
    if (c === null) return ERR("gzip: no such file");
    fs.writeFile(p + ".gz", c);
    fs.unlink(p);
    return OK();
  };
  CMDS.gunzip = (a) => {
    const p = fs.resolve(flags(a).rest[0] || "");
    const c = fs.readFile(p);
    if (c === null || !p.endsWith(".gz")) return ERR("gunzip: not in gzip format");
    fs.writeFile(p.slice(0, -3), c);
    fs.unlink(p);
    return OK();
  };

  CMDS.file = (a) => {
    let out = "";
    for (const p of a) {
      const n = fs.getNode(fs.resolve(p), false);
      if (!n) {
        out += p + ": cannot open (No such file or directory)\n";
        continue;
      }
      if (n.t === "d") out += p + ": directory\n";
      else if (n.t === "l") out += p + ": symbolic link to " + n.target + "\n";
      else if (n.content.slice(0, TAR_MAGIC.length) === TAR_MAGIC) out += p + ": gzip compressed data, from Unix\n";
      else if (n.content.startsWith("#!"))
        out += p + ": " + (n.content.split("\n")[0].includes("bash") ? "Bourne-Again shell script" : "script") + ", ASCII text executable\n";
      else if (n.content === "") out += p + ": empty\n";
      else out += p + ": ASCII text\n";
    }
    return OK(out);
  };

  CMDS.stat = (a) => {
    const p = a[0];
    const n = fs.getNode(fs.resolve(p || ""), false);
    if (!n) return ERR("stat: cannot statx '" + p + "': No such file or directory");
    const uid = users.users[n.owner]?.uid ?? 1000;
    const gid = users.groups[n.group]?.gid ?? 1000;
    return OK(
      "  File: " + p + "\n  Size: " + sizeOf(n) + "\t\tType: " +
        (n.t === "d" ? "directory" : n.t === "l" ? "symbolic link" : "regular file") +
        "\nAccess: (0" + n.mode + "/" + modeStr(n) + ")  Uid: (" + String(uid).padStart(5) + "/" + n.owner.padStart(7) +
        ")   Gid: (" + String(gid).padStart(5) + "/" + n.group.padStart(7) + ")\nModify: 2026-09-14 09:24:11\n"
    );
  };

  CMDS.history = () => OK(session.history.map((h, i) => String(i + 1).padStart(5) + "  " + h).join("\n") + "\n");

  CMDS.man = (a) => {
    const t = a[0];
    const pages: Record<string, string> = {
      ls: "ls - list directory contents\n  -l  long listing\n  -a  do not ignore entries starting with .\n  -h  human-readable sizes\n  -R  recurse into subdirectories",
      mkdir: "mkdir - make directories\n  -p  no error if existing, make parent directories as needed",
      rm: "rm - remove files or directories\n  -r  remove directories and their contents recursively\n  -f  never prompt\n  -i  prompt before every removal",
      cp: "cp - copy files and directories\n  -r  copy directories recursively\n  -a  archive mode: preserve mode, ownership, timestamps",
      grep: "grep - print lines matching a pattern\n  -i  ignore case\n  -r  recursive\n  -n  line numbers\n  -c  count matching lines\n  -v  invert match\n  -E  extended regular expressions",
      find: "find - search for files in a directory hierarchy\n  -name PATTERN   match the file name\n  -type f|d       restrict to files or directories\n  -maxdepth N     descend at most N levels",
      chmod: "chmod - change file mode bits\n  Numeric: r=4 w=2 x=1, one digit per class (owner, group, other)\n  Symbolic: u/g/o/a followed by +/-/= and rwx\n  -R  recurse",
      tar: "tar - archiving utility\n  -c  create   -x  extract   -t  list\n  -z  filter through gzip\n  -f  use archive file\n  -C  change to directory before extracting",
      wc: "wc - print newline, word and byte counts\n  -l  lines only\n  -w  words only\n  -c  bytes only",
      ln: "ln - make links between files\n  -s  make symbolic links instead of hard links",
    };
    if (!t) return ERR("What manual page do you want?");
    return pages[t] ? OK("NAME\n  " + pages[t] + "\n") : ERR("No manual entry for " + t);
  };

  CMDS.help = () =>
    OK(
      "Available in this sandbox:\n\n" +
        "  navigate   pwd  ls  cd  tree  find  which  stat  file\n" +
        "  files      touch  cat  less  head  tail  wc  echo  printf\n" +
        "  manage     mkdir  rmdir  cp  mv  rm  ln  chmod  du  df\n" +
        "  text       grep  sort  uniq  cut  awk  tee\n" +
        "  archive    tar  gzip  gunzip\n" +
        "  shell      pipes |   redirection > >> 2> 2>&1 <   chaining && || ;\n" +
        "             globs *   braces {a,b}   heredoc <<'EOF'   history\n" +
        "  lab        check   hint   hint N   solution   reset   next   labs\n\n" +
        "Try `man ls` for a short page on any of the main commands.\n"
    );

  return CMDS;
}
