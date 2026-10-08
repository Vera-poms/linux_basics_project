export interface Token {
  v: string;
  q: string | null;
}

export function tokenize(line: string): Token[] {
  const toks: Token[] = [];
  let cur = "";
  let q: string | null = null;
  let qc: string | null = null;
  let has = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
      has = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      q = ch;
      qc = qc === "'" ? "'" : ch;
      has = true;
      continue;
    }
    if (ch === "#" && !has) break; // an unquoted # at the start of a word begins a comment
    if (ch === "\\" && i + 1 < line.length) {
      cur += line[++i];
      has = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (has) {
        toks.push({ v: cur, q: qc });
        cur = "";
        qc = null;
        has = false;
      }
      continue;
    }
    cur += ch;
    has = true;
  }
  if (has) toks.push({ v: cur, q: qc });
  return toks;
}

export function expandBraces(s: string): string[] {
  const m = s.match(/^(.*?)\{([^{}]*,[^{}]*|-?\d+\.\.-?\d+|[a-zA-Z]\.\.[a-zA-Z])\}(.*)$/);
  if (!m) return [s];
  const out: string[] = [];
  let items: string[];
  if (!m[2].includes(",")) {
    // A range such as {1..3} or {a..e}, counting down when the start is larger.
    const [from, to] = m[2].split("..");
    const numeric = /^-?\d+$/.test(from);
    const a = numeric ? parseInt(from, 10) : from.charCodeAt(0);
    const b = numeric ? parseInt(to, 10) : to.charCodeAt(0);
    const step = a <= b ? 1 : -1;
    items = [];
    for (let k = a; step > 0 ? k <= b : k >= b; k += step) items.push(numeric ? String(k) : String.fromCharCode(k));
  } else items = m[2].split(",");
  for (const opt of items)
    for (const tail of expandBraces(m[1] + opt + m[3])) out.push(tail);
  return out;
}

export function globMatch(pat: string, name: string): boolean {
  let re = "^";
  for (const ch of pat) {
    if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(re + "$").test(name);
}

export interface Redirs {
  out: string | null;
  outApp: boolean;
  err: string | null;
  errApp: boolean;
  errToOut: boolean;
  in: string | null;
}

/** Split a line on ; && || at top level (outside quotes). */
export function splitChains(line: string): { cmd: string; op: string }[] {
  const parts: { cmd: string; op: string }[] = [];
  let cur = "";
  let q: string | null = null;
  let op = ";";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      cur += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      q = ch;
      cur += ch;
      continue;
    }
    if (ch === "&" && line[i + 1] === "&") {
      parts.push({ cmd: cur, op });
      op = "&&";
      cur = "";
      i++;
      continue;
    }
    if (ch === "|" && line[i + 1] === "|") {
      parts.push({ cmd: cur, op });
      op = "||";
      cur = "";
      i++;
      continue;
    }
    if (ch === ";") {
      parts.push({ cmd: cur, op });
      op = ";";
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push({ cmd: cur, op });
  return parts.filter((p) => p.cmd.trim() !== "");
}

export function splitPipes(line: string): string[] {
  const parts: string[] = [];
  let cur = "";
  let q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      cur += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      q = ch;
      cur += ch;
      continue;
    }
    if (ch === "|" && line[i + 1] !== "|" && line[i - 1] !== "|") {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}
