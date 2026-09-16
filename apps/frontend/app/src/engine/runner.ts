import type { CmdResult } from "./types";
import { FileSystem, HOME } from "./filesystem";
import { tokenize, expandBraces, globMatch, splitChains, splitPipes, type Token } from "./shell";
import { createCommands, type CommandFn, type ShellSession } from "./commands";
import { UserDB } from "./users";

interface Redirs {
  out: string | null;
  outApp: boolean;
  err: string | null;
  errApp: boolean;
  errToOut: boolean;
  in: string | null;
}

/** One self-contained terminal session: filesystem + shell parsing/execution + history. */
export class Shell {
  fs = new FileSystem();
  users = new UserDB();
  session: ShellSession = { history: [], lastCode: 0, currentUser: "labex", sudoActive: false };
  ranScripts = new Set<string>();
  heredoc: { delim: string; cmdLine: string; buf: string[] } | null = null;
  cmds: Record<string, CommandFn>;
  /** Extra commands (e.g. lab check/hint/solution/reset/next) layered on top of CMDS. */
  extraCmds: Record<string, CommandFn> = {};

  constructor() {
    this.cmds = createCommands(this.fs, this.session, this.users);
    this.syncUserFiles();
  }

  private syncUserFiles() {
    this.fs.writeFile("/etc/passwd", this.users.renderPasswd());
    this.fs.writeFile("/etc/group", this.users.renderGroup());
    this.fs.writeFile("/etc/shadow", this.users.renderShadow());
  }

  reset(setup?: () => void) {
    this.fs.reset();
    this.users = new UserDB();
    this.cmds = createCommands(this.fs, this.session, this.users);
    this.syncUserFiles();
    this.ranScripts = new Set();
    if (setup) setup();
  }

  private env(): Record<string, () => string> {
    return {
      HOME: () => HOME,
      PWD: () => this.fs.cwd,
      OLDPWD: () => HOME,
      USER: () => "labex",
      LOGNAME: () => "labex",
      SHELL: () => "/bin/bash",
      HOSTNAME: () => "sandbox",
      PATH: () => "/usr/local/bin:/usr/bin:/bin",
      TERM: () => "xterm-256color",
      LANG: () => "C.UTF-8",
    };
  }

  private expandVars(s: string): string {
    if (s[0] === "~" && (s.length === 1 || s[1] === "/")) s = HOME + s.slice(1);
    const env = this.env();
    s = s.replace(/\$\?/g, () => String(this.session.lastCode));
    return s.replace(/\$\{(\w+)\}|\$(\w+)/g, (_m, a, b) => {
      const k = a || b;
      return env[k] !== undefined ? env[k]() : "";
    });
  }

  /** $(...) and `...` — run the inner command, splice its output back in. */
  private substitute(seg: string): string {
    let guard = 0;
    while (guard++ < 8) {
      const m = seg.match(/\$\(([^()]*)\)/) || seg.match(/`([^`]*)`/);
      if (!m) break;
      const before = seg.slice(0, m.index);
      if ((before.split("'").length - 1) % 2 === 1) break; // inside single quotes: leave alone
      const out = this.runLine(m[1]).out.replace(/\n+$/, "").replace(/\n/g, " ");
      seg = before + out + seg.slice((m.index ?? 0) + m[0].length);
    }
    return seg;
  }

  private expandGlob(tok: Token): string[] {
    if (tok.q || !/[*?]/.test(tok.v)) return [tok.v];
    const abs = tok.v[0] === "/";
    const segs = tok.v.split("/").filter((s, i) => !(i === 0 && s === ""));
    let bases = [abs ? "/" : ""];
    for (const seg of segs) {
      const next: string[] = [];
      for (const b of bases) {
        if (!/[*?]/.test(seg)) {
          next.push(b === "" ? seg : b === "/" ? "/" + seg : b + "/" + seg);
          continue;
        }
        const dirPath = this.fs.resolve(b === "" ? "." : b);
        const node = this.fs.getNode(dirPath);
        if (!node || node.t !== "d") continue;
        for (const name of Object.keys(node.children).sort()) {
          if (name[0] === "." && seg[0] !== ".") continue;
          if (globMatch(seg, name)) next.push(b === "" ? name : b === "/" ? "/" + name : b + "/" + name);
        }
      }
      bases = next;
    }
    return bases.length ? bases : [tok.v];
  }

  private expandAll(toks: Token[]): string[] {
    const out: string[] = [];
    for (const t of toks) {
      if (t.q === "'") {
        out.push(t.v);
        continue;
      }
      const v = this.expandVars(t.v);
      if (t.q === '"') {
        out.push(v);
        continue;
      }
      for (const b of expandBraces(v)) for (const g of this.expandGlob({ v: b, q: null })) out.push(g);
    }
    return out;
  }

  private extractRedirs(toks: Token[]): { args: Token[]; r: Redirs } {
    const args: Token[] = [];
    const r: Redirs = { out: null, outApp: false, err: null, errApp: false, errToOut: false, in: null };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.q) {
        args.push(t);
        continue;
      }
      const v = t.v;
      if (v === "2>&1") {
        r.errToOut = true;
        continue;
      }
      const m = v.match(/^(2?)(>>|>|<)(.*)$/);
      if (m) {
        const target = m[3] !== "" ? m[3] : toks[++i] ? toks[i].v : "";
        if (m[3] === "" && !target) continue;
        const tgt = this.expandVars(target);
        if (m[2] === "<") r.in = tgt;
        else if (m[1] === "2") {
          r.err = tgt;
          r.errApp = m[2] === ">>";
        } else {
          r.out = tgt;
          r.outApp = m[2] === ">>";
        }
        continue;
      }
      if (v === "&>") {
        const target = toks[++i] ? toks[i].v : "";
        r.out = target;
        r.errToOut = true;
        continue;
      }
      args.push(t);
    }
    return { args, r };
  }

  private runScript(path: string, node: { content: string }): CmdResult {
    this.ranScripts.add(path);
    const body = node.content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    let out = "";
    let err = "";
    for (const l of body) {
      const r = this.runLine(l);
      out += r.out;
      err += r.err;
    }
    return { out, err, code: 0 };
  }

  private runSimple(segment: string, stdin?: string): CmdResult {
    const toks = tokenize(this.substitute(segment));
    if (!toks.length) return { out: "", err: "", code: 0 };
    const { args, r } = this.extractRedirs(toks);
    const argv = this.expandAll(args);
    if (!argv.length) return { out: "", err: "", code: 0 };
    const name = argv[0];
    const rest = argv.slice(1);

    if (r.in !== null) {
      const c = this.fs.readFile(this.fs.resolve(r.in));
      if (c === null) return { out: "", err: "bash: " + r.in + ": No such file or directory\n", code: 1 };
      stdin = c;
    }

    let res: CmdResult;
    if (name === "sudo") {
      if (!rest.length) res = { out: "", err: "usage: sudo command\n", code: 1 };
      else {
        this.session.sudoActive = true;
        try {
          const innerName = rest[0];
          const innerArgs = rest.slice(1);
          res = this.cmds[innerName]
            ? this.cmds[innerName](innerArgs, stdin === undefined ? "" : stdin)
            : { out: "", err: "sudo: " + innerName + ": command not found\n", code: 127 };
        } finally {
          this.session.sudoActive = false;
        }
      }
    } else if (name.includes("/") && (name.startsWith("./") || name.startsWith("/") || name.startsWith("../"))) {
      const abs = this.fs.resolve(name);
      const n = this.fs.getNode(abs);
      if (!n) res = { out: "", err: "bash: " + name + ": No such file or directory\n", code: 1 };
      else if (n.t !== "f") res = { out: "", err: "bash: " + name + ": Is a directory\n", code: 1 };
      else if (!(parseInt(n.mode[0], 10) & 1)) res = { out: "", err: "bash: " + name + ": Permission denied\n", code: 1 };
      else res = this.runScript(abs, n);
    } else if (this.cmds[name]) res = this.cmds[name](rest, stdin === undefined ? "" : stdin);
    else if (this.extraCmds[name]) res = this.extraCmds[name](rest);
    else res = { out: "", err: "bash: " + name + ": command not found\n", code: 1 };

    if (r.errToOut && !r.out) res = { out: res.out + res.err, err: "", code: res.code };
    if (r.out !== null) {
      const abs = this.fs.resolve(r.out);
      let payload = res.out;
      if (r.errToOut) {
        payload = res.out + res.err;
        res = { ...res, err: "" };
      }
      const prev = r.outApp ? this.fs.readFile(abs) || "" : "";
      if (!this.fs.writeFile(abs, prev + payload))
        return { out: "", err: "bash: " + r.out + ": No such file or directory\n", code: 1 };
      res = { out: "", err: res.err, code: res.code };
    }
    if (r.err !== null) {
      const abs = this.fs.resolve(r.err);
      const prev = r.errApp ? this.fs.readFile(abs) || "" : "";
      this.fs.writeFile(abs, prev + res.err);
      res = { out: res.out, err: "", code: res.code };
    }
    return res;
  }

  private execWithStdin(cmdLine: string, input: string): CmdResult {
    const toks = tokenize(cmdLine);
    const { args, r } = this.extractRedirs(toks);
    const argv = this.expandAll(args);
    if (!argv.length) return { out: "", err: "", code: 0 };
    const run = this.cmds[argv[0]]
      ? this.cmds[argv[0]](argv.slice(1), input)
      : { out: "", err: "bash: " + argv[0] + ": command not found\n", code: 1 };
    if (r.out !== null) {
      const abs = this.fs.resolve(r.out);
      const prev = r.outApp ? this.fs.readFile(abs) || "" : "";
      if (!this.fs.writeFile(abs, prev + run.out))
        return { out: "", err: "bash: " + r.out + ": No such file or directory\n", code: 1 };
      return { out: "", err: run.err, code: run.code };
    }
    return run;
  }

  runLine(line: string): CmdResult {
    let out = "";
    let err = "";
    let code = 0;
    for (const chain of splitChains(line)) {
      if (chain.op === "&&" && code !== 0) continue;
      if (chain.op === "||" && code === 0) continue;
      const stages = splitPipes(chain.cmd);
      let stdin = "";
      for (let i = 0; i < stages.length; i++) {
        const res = this.runSimple(stages[i], stdin);
        err += res.err;
        code = res.code;
        if (i === stages.length - 1) out += res.out;
        else stdin = res.out;
      }
    }
    this.session.lastCode = code;
    return { out, err, code };
  }

  /** Feeds one typed line in; handles heredoc accumulation across calls. */
  feedLine(line: string): CmdResult {
    if (this.heredoc) {
      if (line.trim() === this.heredoc.delim) {
        const hd = this.heredoc;
        this.heredoc = null;
        const res = this.execWithStdin(hd.cmdLine, hd.buf.join("\n") + (hd.buf.length ? "\n" : ""));
        return { ...res, pending: false };
      }
      this.heredoc.buf.push(line);
      return { out: "", err: "", code: 0, pending: true };
    }
    const hd = line.match(/<<\s*'?"?([A-Za-z_][A-Za-z0-9_]*)'?"?\s*$/);
    if (hd) {
      this.heredoc = { delim: hd[1], cmdLine: line.slice(0, hd.index), buf: [] };
      return { out: "", err: "", code: 0, pending: true };
    }
    const res = this.runLine(line);
    return { ...res, pending: false };
  }
}
