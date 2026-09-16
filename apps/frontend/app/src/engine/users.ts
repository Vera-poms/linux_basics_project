import { PASSWD } from "./filesystem";

export interface UserRecord {
  name: string;
  uid: number;
  gid: number;
  gecos: string;
  home: string;
  shell: string;
  /** Supplementary (non-primary) group names. */
  groups: string[];
}

export interface GroupRecord {
  name: string;
  gid: number;
  members: string[];
}

function parsePasswd(text: string): UserRecord[] {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const [name, , uid, gid, gecos, home, shell] = l.split(":");
      return { name, uid: parseInt(uid, 10), gid: parseInt(gid, 10), gecos: gecos || "", home, shell, groups: [] };
    });
}

/** Simulated /etc/passwd + /etc/group + /etc/shadow, mutated by useradd/usermod/passwd. */
export class UserDB {
  users: Record<string, UserRecord> = {};
  groups: Record<string, GroupRecord> = {};
  /** true = password set (unlocked); false = locked, matching a fresh "!" shadow entry. */
  private unlocked: Record<string, boolean> = {};
  private uidCounter = 1001;
  private gidCounter = 1001;

  constructor() {
    for (const u of parsePasswd(PASSWD)) {
      this.users[u.name] = u;
      this.groups[u.name] = { name: u.name, gid: u.gid, members: [] };
      this.unlocked[u.name] = false;
    }
    this.groups["sudo"] = { name: "sudo", gid: 27, members: ["labex"] };
    this.uidCounter = 1001;
    this.gidCounter = 28;
  }

  private primaryGroupName(u: UserRecord): string {
    for (const g of Object.values(this.groups)) if (g.gid === u.gid) return g.name;
    return u.name;
  }

  /** Primary group first, then supplementary groups the user is a member of. */
  groupsOf(name: string): string[] {
    const u = this.users[name];
    if (!u) return [];
    const primary = this.primaryGroupName(u);
    const supplementary = Object.values(this.groups)
      .filter((g) => g.name !== primary && g.members.includes(name))
      .map((g) => g.name);
    return [primary, ...supplementary];
  }

  isLocked(name: string): boolean {
    return !this.unlocked[name];
  }

  addGroup(name: string): { ok: boolean; err?: string } {
    if (this.groups[name]) return { ok: false, err: "groupadd: group '" + name + "' already exists" };
    this.groups[name] = { name, gid: this.gidCounter++, members: [] };
    return { ok: true };
  }

  addToGroup(user: string, group: string): { ok: boolean; err?: string } {
    if (!this.users[user]) return { ok: false, err: "usermod: user '" + user + "' does not exist" };
    if (!this.groups[group]) return { ok: false, err: "usermod: group '" + group + "' does not exist" };
    if (!this.groups[group].members.includes(user)) this.groups[group].members.push(user);
    return { ok: true };
  }

  setPrimaryGroup(user: string, group: string): { ok: boolean; err?: string } {
    if (!this.users[user]) return { ok: false, err: "usermod: user '" + user + "' does not exist" };
    if (!this.groups[group]) return { ok: false, err: "usermod: group '" + group + "' does not exist" };
    this.users[user].gid = this.groups[group].gid;
    return { ok: true };
  }

  setShell(user: string, shell: string): { ok: boolean; err?: string } {
    if (!this.users[user]) return { ok: false, err: "usermod: user '" + user + "' does not exist" };
    this.users[user].shell = shell;
    return { ok: true };
  }

  addUser(
    name: string,
    opts: { home?: string; shell?: string; groups?: string[] }
  ): { ok: boolean; err?: string } {
    if (this.users[name]) return { ok: false, err: "useradd: user '" + name + "' already exists" };
    if (!/^[a-z_][a-z0-9_-]*$/.test(name)) return { ok: false, err: "useradd: invalid user name '" + name + "'" };
    const uid = this.uidCounter++;
    this.addGroup(name);
    const rec: UserRecord = {
      name,
      uid,
      gid: this.groups[name].gid,
      gecos: "",
      home: opts.home || "/home/" + name,
      shell: opts.shell || "/bin/bash",
      groups: [],
    };
    this.users[name] = rec;
    this.unlocked[name] = false;
    for (const g of opts.groups || []) this.addToGroup(name, g);
    return { ok: true };
  }

  setPassword(name: string): { ok: boolean; err?: string } {
    if (!this.users[name]) return { ok: false, err: "passwd: user '" + name + "' does not exist" };
    this.unlocked[name] = true;
    return { ok: true };
  }

  renderPasswd(): string {
    return (
      Object.values(this.users)
        .map((u) => [u.name, "x", u.uid, u.gid, u.gecos, u.home, u.shell].join(":"))
        .join("\n") + "\n"
    );
  }

  renderGroup(): string {
    return (
      Object.values(this.groups)
        .map((g) => [g.name, "x", g.gid, g.members.join(",")].join(":"))
        .join("\n") + "\n"
    );
  }

  renderShadow(): string {
    return (
      Object.keys(this.users)
        .map((name) => [name, this.unlocked[name] ? "$6$simulated$hash" : "!", "19700", "0", "99999", "7", "", "", ""].join(":"))
        .join("\n") + "\n"
    );
  }
}
